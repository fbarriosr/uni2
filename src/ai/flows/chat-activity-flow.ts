
'use server';
/**
 * @fileOverview An AI chat assistant for suggesting activities, capable of performing structured searches and app navigation.
 *
 * - chatActivity - A function that handles the chat interaction.
 * - ChatActivityInput - The input type for the chatActivity function.
 * - ChatActivityOutput - The return type for the chatActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getActivities, activityCategories as allCategories } from '@/lib/data'; // To fetch activities
import type { User } from '@/lib/types'; // Import Activity type
import { collection, query, where, orderBy, getDocs, Timestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';


// Define a Zod schema for Activity to be used in the output
// We only need a subset of fields for the chat card display usually
const ActivitySchemaForChat = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  location: z.string(),
  price: z.number(),
  category: z.string(), // Using string for simplicity, can be z.enum(activityCategories)
  images: z.array(z.string()).optional(),
  // Add other fields if ChatActivityCard uses them and they are essential for the LLM or tool.
});

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().describe('The text content of the message.'),
});

const ChatActivityInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The full conversation history between the user and the assistant, including the latest message from the user.'),
  userId: z.string().optional().describe('The ID of the currently logged-in user. Required for user-specific actions like finding their next outing or planning an outing.'),
  systemPrompt: z.string().optional().describe('The base system prompt that defines the agent\'s persona and primary goal. This will be provided by the frontend based on the selected agent.'),
});
export type ChatActivityInput = z.infer<typeof ChatActivityInputSchema>;

const ChatActivityOutputSchema = z.object({
  aiResponse: z.string().describe("The AI's response to the user. It should confirm any action taken, like navigation or search."),
  foundActivities: z.array(ActivitySchemaForChat).optional().describe("A list of activities found. Must be an array, can be empty."),
  navigationAction: z.object({
    route: z.string().describe("The route to navigate to, e.g., '/nueva_salida'.")
  }).nullable().optional().describe("An action to navigate the user to a different page. Should be null if no navigation is needed."),
   quickReplies: z.array(z.string()).optional().describe("A list of suggested replies for the user to click, to guide the conversation."),
});
export type ChatActivityOutput = z.infer<typeof ChatActivityOutputSchema>;


const ChildDetailsSchema = z.object({
  name: z.string().describe("The child's name or nickname."),
  email: z.string().optional().describe("The child's email address, if available."),
});

const listFamilyMembers = ai.defineTool(
  {
    name: 'listFamilyMembers',
    description: "Lists the registered children for a user, including their name and email. Use this when asked for details about the children, like 'what is my son's email?' or 'list my children'.",
    inputSchema: z.object({
      userId: z.string().describe("The ID of the user asking."),
    }),
    outputSchema: z.object({
      children: z.array(ChildDetailsSchema).describe("A list of children with their details."),
    }),
  },
  async (input) => {
    if (!input.userId) {
      console.warn("User ID is missing in listFamilyMembers tool.");
      return { children: [] };
    }
    try {
      const userDocRef = doc(db, 'users', input.userId);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        console.warn(`User document with ID ${input.userId} does not exist.`);
        return { children: [] };
      }

      const userData = userSnap.data() as User;
      const familyMemberIds: string[] = userData.familyMembers || [];

      if (familyMemberIds.length === 0) {
        console.log("No family members found for this user.");
        return { children: [] };
      }

      const memberDocs = await Promise.all(
        familyMemberIds.map((id) => getDoc(doc(db, 'users', id)))
      );

      const children = memberDocs
        .filter((snap) => snap.exists())
        .map((snap) => {
          const data = snap.data() as User;
          // Ensure name is robustly determined.
          const name = data.nickname || data.name || 'Nombre no registrado';
          // Securely get the email, ensuring it's either a string or undefined.
          const email = typeof data.email === 'string' ? data.email : undefined; 
          return { name, email };
        });
      
      return { children };
    } catch (error) {
      console.error("Error in listFamilyMembers tool:", error);
      return { children: [] };
    }
  }
);


// Define the tool for searching activities by name
const searchActivitiesByNameTool = ai.defineTool(
  {
    name: 'searchActivitiesByName',
    description: 'Searches for activities where the name starts with a given term. Use this if the user asks to "find", "search", "look for", or "busca" activities with a specific term or name. This search is case-sensitive for "starts-with" matches.',
    inputSchema: z.object({
      searchTerm: z.string().describe('The name or keyword to search for. For a "starts-with" search, the case should match the beginning of the activity name. For example, if the user types "Parque de diversiones", the searchTerm should ideally be "Parque" or "Parque de diversiones".'),
    }),
    outputSchema: z.object({
      activities: z.array(ActivitySchemaForChat).describe('A list of activities where the name starts with the search term.'),
    }),
  },
  async (input) => {
    console.log(`Tool 'searchActivitiesByName' called with searchTerm: ${input.searchTerm}`);
    const searchTerm = input.searchTerm; 

    if (!searchTerm || searchTerm.trim() === '') {
        console.log("Search term is empty, returning no activities.");
        return { activities: [] };
    }

    const activitiesCollectionRef = collection(db, 'activities');
    // Query for "starts with" (case-sensitive) and filter by published status
    const q = query(
        activitiesCollectionRef,
        where('status', '==', 'publicada'),
        orderBy('name'), 
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
    );

    try {
        const querySnapshot = await getDocs(q);
        const foundActivities = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            // Map to ActivitySchemaForChat structure
            return {
                id: docSnap.id,
                name: data.name || 'Nombre no disponible',
                description: data.description || 'Descripción no disponible',
                location: data.location || 'Ubicación no disponible',
                price: typeof data.price === 'number' ? data.price : 0,
                category: data.category || 'Categoría no especificada',
                images: Array.isArray(data.images) ? data.images : [],
            };
        });

        console.log(`Tool 'searchActivitiesByName' (Firestore query) found ${foundActivities.length} activities. Details:`, JSON.stringify(foundActivities, null, 2));
        return { activities: foundActivities as Activity[] }; // Ensure it returns as Activity[] if ActivitySchemaForChat is compatible
    } catch (error) {
        console.error("Error querying Firestore in searchActivitiesByNameTool:", error);
        return { activities: [] }; 
    }
  }
);

const navigateToPageTool = ai.defineTool(
  {
    name: 'navigateToPage',
    description: "Navigates the user to a specified application page. Use this for simple navigation requests like 'go to home page' or 'go to my outings'. DO NOT use this for planning a new outing; use the 'planNewOuting' tool for that.",
    inputSchema: z.object({
      route: z.string().describe("The destination path, e.g., '/inicio'.")
    }),
    outputSchema: z.object({
      status: z.string()
    }),
  },
  async (input) => {
    console.log(`Tool 'navigateToPage' called with route: ${input.route}. The frontend will handle the navigation.`);
    return { status: `Navigation instruction for ${input.route} will be sent to the client.` };
  }
);

const navigateToNextOutingTool = ai.defineTool(
  {
    name: 'navigateToNextOuting',
    description: "Finds the user's next scheduled outing and returns a direct navigation route to it. Use this when the user asks to see their 'next outing' ('próxima salida'), 'next plan' ('siguiente plan'), or similar.",
    inputSchema: z.object({
      userId: z.string().describe("The ID of the user asking for their next outing.")
    }),
    outputSchema: z.object({
      route: z.string().nullable().describe("The navigation route to the next outing, e.g., '/salidas/some-id', or null if none is found.")
    }),
  },
  async (input) => {
    console.log(`Tool 'navigateToNextOuting' called for userId: ${input.userId}`);
    if (!input.userId) {
        console.log("User ID is missing, cannot find next outing.");
        return { route: null };
    }
    
    try {
        const now = new Date();
        const outingsRef = collection(db, 'users', input.userId, 'salidas');
        // Query for outings where the start date is in the future, order by date ascending
        const q = query(
            outingsRef, 
            where('dateRange.from', '>=', now), 
            orderBy('dateRange.from', 'asc')
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            console.log("No upcoming outings found for user.");
            return { route: null };
        }

        const nextOutingDoc = querySnapshot.docs[0];
        const route = `/salidas/${nextOutingDoc.id}`;
        console.log(`Found next outing. Navigation route: ${route}`);
        return { route };
    } catch (error) {
        console.error("Error querying Firestore in navigateToNextOutingTool:", error);
        return { route: null };
    }
  }
);

const planNewOutingTool = ai.defineTool(
  {
    name: 'planNewOuting',
    description: "Initiates planning for a new outing. Use this tool once you have gathered information about participants, date, transport, and preferences. The AI must parse natural language dates into YYYY-MM-DD format. The tool can identify participants from a query like 'mi hijo', 'mis hijas', or a specific name like 'Monce'. If the participant query is ambiguous, it will ask for clarification.",
    inputSchema: z.object({
        userId: z.string().describe("The ID of the currently logged-in user."),
        participantsQuery: z.string().optional().describe("The user's description of who is going. You MUST extract only the names or specific relations (e.g., 'Monce', 'mi hijo', 'mis hijas'). Do not include conversational words like 'con' or 'viajo con'."),
        dateFrom: z.string().optional().describe("The start date in YYYY-MM-DD format. The AI must parse the user's natural language date into this format."),
        dateTo: z.string().optional().describe("The end date in YYYY-MM-DD format, if it's a range."),
        transportMode: z.string().optional().describe("The mode of transport, like 'auto', 'caminando', 'transportePublico'."),
        filters: z.array(z.string()).optional().describe("A list of activity preferences, like 'aireLibre', 'animales'."),
        otherPreference: z.string().optional().describe("A specific user-written preference not in the predefined list, e.g., 'ir de compras'.")
    }),
    outputSchema: z.object({
        route: z.string().nullable().describe("The generated URL route to pre-fill the form, or null if more info is needed."),
        clarificationQuestion: z.string().nullable().describe("A question to ask the user if the participant query is ambiguous, e.g., '¿Te refieres a Juan o a Pedro?'.")
    }),
  },
  async (input) => {
    try {
      console.log(`Tool 'planNewOuting' called with input:`, input);
      const { userId, participantsQuery, dateFrom, dateTo, transportMode, filters, otherPreference } = input;
      
      if (!userId) return { route: null, clarificationQuestion: null };

      const searchParams = new URLSearchParams();
      let identifiedParticipantIds: string[] = [];

      // Participant identification logic
      if (participantsQuery) {
        const userDocRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as User;
          const familyMemberIds: string[] = userData.familyMembers || [];

          if (familyMemberIds.length > 0) {
            const memberDocs = await Promise.all(familyMemberIds.map(id => getDoc(doc(db, 'users', id))));
            const familyMembers = memberDocs
              .filter(snap => snap.exists())
              .map(snap => ({ id: snap.id, ...snap.data() } as User));
            
            let potentialMatches: User[] = [];
            const q = participantsQuery.toLowerCase().trim();
            // Robustly clean the query to isolate name(s)
            const queryForName = q.replace(/\b(con|mi|mis|y|yo|los|las|el|ella|ellos|ellas|viajo|viajar|ir|con|actualiza|ahora|hijo|hija|hijos|hijas|niños|niñas)\b/g, '').replace(/\s+/g, ' ').trim();

            // 1. Prioritize specific name matching
            if (queryForName) {
                const searchNames = queryForName.split(' ').filter(Boolean);
                potentialMatches = familyMembers.filter(member => {
                    const memberName = member.name?.toLowerCase() || '';
                    const memberNickname = member.nickname?.toLowerCase() || '';
                    // Check if all of the search terms are included in the member's name or nickname
                    return searchNames.every(searchName => {
                        return memberName.includes(searchName) || memberNickname.includes(searchName);
                    });
                });
            }

            // 2. If no specific name match, fall back to generic queries
            if (potentialMatches.length === 0) {
              if (q.includes('hija') && !q.includes('hijas')) { // 'hija' (singular)
                  potentialMatches = familyMembers.filter(m => m.gender === 'female');
              } else if (q.includes('hijas')) { // 'hijas' (plural)
                  potentialMatches = familyMembers.filter(m => m.gender === 'female');
              } else if (q.includes('hijo') && !q.includes('hijos')) { // 'hijo' (singular)
                  potentialMatches = familyMembers.filter(m => m.gender === 'male');
              } else if (q.includes('hijos') || q.includes('niños')) { // 'hijos' (plural), 'niños'
                  potentialMatches = familyMembers; // Assume all children
              }
            }

            // 3. Handle ambiguity
            if (potentialMatches.length > 1) {
              // Only ask for clarification on vague singulars, not on plurals or specific name searches that return multiple.
              if ((q.includes('hijo') && !q.includes('hijos')) || (q.includes('hija') && !q.includes('hijas'))) {
                  const names = potentialMatches.map(m => m.name).join(' o ');
                  const question = `Tengo ${potentialMatches.length > 1 ? 'varios hijos registrados' : 'una hija registrada'} con ese criterio. ¿Te refieres a ${names}?`;
                  return { route: null, clarificationQuestion: question };
              }
            }
            
            identifiedParticipantIds = potentialMatches.map(m => m.id);
          }
        }
      }

      if (identifiedParticipantIds.length > 0) {
        searchParams.set('participantIds', identifiedParticipantIds.join(','));
      }
      
      // Build the rest of the route
      if (dateFrom) searchParams.set('dateFrom', dateFrom);
      if (dateTo) searchParams.set('dateTo', dateTo);
      if (transportMode) searchParams.set('transportMode', transportMode);
      if (filters && filters.length > 0) searchParams.set('filters', filters.join(','));
      if (otherPreference) searchParams.set('otherPreference', otherPreference);
      
      const route = `/nueva_salida?${searchParams.toString()}`;
      console.log("Generated route in tool:", route);
      return { route: route, clarificationQuestion: null };

    } catch (error) {
        console.error("Error executing planNewOutingTool:", error);
        return { route: null, clarificationQuestion: 'Tuve un problema al buscar a los participantes. Por favor, intenta de nuevo.' };
    }
  }
);


export async function chatActivity(input: ChatActivityInput): Promise<ChatActivityOutput> {
  return chatActivityFlow(input);
}

// Default base prompt for the UNI2 assistant if none is provided from the frontend
const DEFAULT_UNI2_PROMPT = `You are a friendly and helpful AI assistant specialized in planning family outings. Your name is "UNI2".
Respond conversationally in Spanish.

Your entire response MUST be a valid JSON object matching this structure:
{
  "aiResponse": "your conversational text response here",
  "foundActivities": [],
  "navigationAction": null,
  "quickReplies": []
}
The \`navigationAction\` field should be an object with a \`route\` key (e.g., { "route": "/nueva_salida?..." }) or null if no navigation is needed.

**Your Primary Goal: Step-by-Step Planning**
Your main job is to help the user plan an outing by gathering 4 key pieces of information. You MUST ask for **one and only one** piece of information at a time. Examine the conversation history to see what you've already asked for and what is missing.

1.  **Participants**: First, ask "¿Para empezar, quiénes van a ir?". If the user's message is just a simple greeting like "hola", you should greet them back first. For example: "¡Hola! Qué bueno verte. Para empezar, ¿quiénes van a ir?". Once you have the answer, move to the next step.
2.  **Date**: Second, ask "¡Perfecto! ¿Para qué fecha o fin de semana están pensando?". Once you have the answer, move to the next step.
3.  **Transport**: Third, ask "¡Entendido! ¿Y cómo planean moverse? ¿En auto, transporte público o caminando?". Once you have the answer, move to the next step.
4.  **Activities**: Fourth, ask "¡Genial! Por último, ¿tienen alguna idea de qué les gustaría hacer? Puedes darme una categoría como 'Aire Libre' o algo específico como 'ir a la montaña'". Once you have the answer, you MUST proceed to the final action.

**Critical Rule - Date Handling:**
- You are a planner for future events. Dates can only be for today or in the future.
- When a user gives a date like "el 24 de agosto" or "en enero", you MUST infer the correct future year.
- Example Logic (assuming today is July 1st, 2025): "24 de agosto" is \`2025-08-24\`. "15 de enero" is \`2026-01-15\`.
- You MUST convert this inferred date to \`YYYY-MM-DD\` format for the tool.
- **You are strictly forbidden from asking the user to confirm the year.** Infer it silently.

**Critical Rule - Final Action:**
- As soon as you have gathered the 4th piece of information (Activities), your **very next response MUST be a call to the \`planNewOuting\` tool**.
- Do not ask more questions. Do not confirm. Just call the tool.
- Your \`aiResponse\` in the JSON output for the tool call should be a confirmation like: "¡Perfecto! Ya tengo todo lo necesario. ¡Un momento, estoy preparando tu plan!".

**Handling Tool Output:**
*   When the \`planNewOuting\` tool is used, it will return a result.
*   **If the tool's result contains a \`route\`**: You MUST copy this exact value into the \`navigationAction.route\` field of your JSON output. Your \`aiResponse\` should be a simple confirmation like: "¡Excelente! He preparado un borrador. Por favor, revisa y confirma los detalles en el formulario."
*   **If the tool's result contains a \`clarificationQuestion\`**: Set \`navigationAction\` to null. Your \`aiResponse\` MUST be the tool's \`clarificationQuestion\`. You can also suggest the potential names as \`quickReplies\`.

**Other Tool Usage Rules:**
- If the user asks for specific details about their children, like their email addresses or just to list them, you MUST use the \`listFamilyMembers\` tool.
- If you use \`searchActivitiesByName\` and it finds activities: \`foundActivities\` must contain them, \`navigationAction\` must be null.
- If you use \`navigateToPage\` or \`navigateToNextOuting\` and it returns a route: \`navigationAction\` must contain the route, \`foundActivities\` must be empty.
- If a tool fails or no tool is appropriate: \`navigationAction\` must be null and \`foundActivities\` must be empty.`;


const prompt = ai.definePrompt({
  name: 'chatActivityPrompt',
  tools: [listFamilyMembers, searchActivitiesByNameTool, navigateToPageTool, navigateToNextOutingTool, planNewOutingTool], 
  input: {schema: ChatActivityInputSchema},
  output: {schema: ChatActivityOutputSchema}, 
  prompt: `{{systemPrompt}}

**Conversation History:**
{{#each history}}
{{this.role}}: {{{this.content}}}
{{/each}}

Based on the full conversation history, process the latest user message by following the rules defined in the system prompt.
{{#if userId}}
User ID for tools: "{{userId}}"
{{/if}}`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const chatActivityFlow = ai.defineFlow(
  {
    name: 'chatActivityFlow',
    inputSchema: ChatActivityInputSchema,
    outputSchema: ChatActivityOutputSchema,
  },
  async (input: ChatActivityInput) => {
    console.log("[chatActivityFlow] Received input:", JSON.stringify(input, null, 2));

    const promptInput = {
      ...input,
      systemPrompt: input.systemPrompt || DEFAULT_UNI2_PROMPT,
    };
    
    let response;
    try {
      response = await prompt(promptInput); 
    } catch (e: any) {
      console.error("[chatActivityFlow] Error during LLM call or output parsing (prompt(input)):", e);
      return { 
        aiResponse: "Estoy teniendo problemas para procesar mi respuesta en este momento, o la respuesta no fue como se esperaba. Por favor, intenta reformular tu solicitud.", 
        foundActivities: [],
        navigationAction: null,
        quickReplies: []
      };
    }
    
    console.log("[chatActivityFlow] LLM Full Response object (after Genkit processing):", JSON.stringify(response, null, 2));
    
    if (!response || !response.output) {
        console.error("[chatActivityFlow] LLM response or response.output was null or undefined after successful prompt call.");
        return { 
          aiResponse: "Lo siento, no pude generar una respuesta significativa para eso. ¿Podrías intentarlo de otra manera?", 
          foundActivities: [],
          navigationAction: null,
          quickReplies: []
        };
    }
    
    const output = response.output;

    // Ensure the response adheres to the schema even if LLM misbehaves slightly.
    return {
        aiResponse: output.aiResponse || "Parece que no tengo una respuesta de texto para eso.",
        foundActivities: Array.isArray(output.foundActivities) ? output.foundActivities : [],
        navigationAction: output.navigationAction || null,
        quickReplies: Array.isArray(output.quickReplies) ? output.quickReplies : []
    };
  }
);
