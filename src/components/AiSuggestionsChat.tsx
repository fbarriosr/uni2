'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, User as UserIcon, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { chatActivity, type ChatActivityInput, type ChatActivityOutput } from '@/ai/flows/chat-activity-flow';
import type { Activity, User as AppUser, Agent } from '@/lib/types';
import ChatActivityCard from './ChatActivityCard';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getUserById } from '@/lib/data';
import Image from 'next/image';


interface Message {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  activities?: Activity[];
  timestamp: Date;
  avatarUrl?: string;
  avatarHint?: string;
  userFallbackName?: string;
  quickReplies?: string[];
}

interface AiSuggestionsChatProps {
  agent: Agent;
}

// Custom animation for wave emoji
const waveAnimation = `
  @keyframes wave-animation {
    0% { transform: rotate(0.0deg); }
    10% { transform: rotate(14.0deg); }
    20% { transform: rotate(-8.0deg); }
    30% { transform: rotate(14.0deg); }
    40% { transform: rotate(-4.0deg); }
    50% { transform: rotate(10.0deg); }
    60% { transform: rotate(0.0deg); }
    100% { transform: rotate(0.0deg); }
  }
`;

const AnimateWave = () => (
  <>
    <style>{waveAnimation}</style>
    <span style={{ animation: 'wave-animation 2.5s infinite', transformOrigin: '70% 70%', display: 'inline-block' }}>
      👋
    </span>
  </>
);


export default function AiSuggestionsChat({ agent }: AiSuggestionsChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // When agent changes, clear the chat history
  useEffect(() => {
    setMessages([]);
  }, [agent]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const appUser = await getUserById(user.uid);
          setCurrentUser(appUser || null);
        } catch (error) {
          console.error("Error fetching app user data:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      // Use a timeout to ensure the new element is rendered before scrolling
      setTimeout(() => {
        if(scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [messages, isLoading]); // Add isLoading to dependency array

  const handleSendMessage = async (eOrText: React.FormEvent<HTMLFormElement> | string) => {
    let textInput: string;
    if (typeof eOrText === 'string') {
        textInput = eOrText;
    } else {
        eOrText.preventDefault();
        textInput = inputValue;
    }

    const trimmedInput = textInput.trim();
    if (!trimmedInput) return;

    // Reset input field only if it was a manual submission
    if (typeof eOrText !== 'string') {
        setInputValue('');
    }

    let userFallbackName = 'U';
    if (currentUser) {
      userFallbackName = currentUser.name?.charAt(0) || currentUser.email?.charAt(0) || 'U';
    }

    const userMessageForUi: Message = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
      avatarUrl: currentUser?.avatarUrl,
      avatarHint: "user profile",
      userFallbackName: userFallbackName.toUpperCase(),
    };

    // Construct the history for the AI, including the new message.
    const historyForAi = messages.map(m => ({
        role: m.role,
        content: m.content || '', // Use empty string for messages without text content
    }));
    historyForAi.push({
        role: 'user',
        content: trimmedInput
    });

    // Update the UI state with the new user message
    setMessages((prevMessages) => [...prevMessages, userMessageForUi]);
    setIsLoading(true);

    try {
      const input: ChatActivityInput = {
        history: historyForAi,
        userId: currentUser?.id,
        // Pass the specific agent's prompt as the system prompt
        systemPrompt: agent.prompt,
      };
      const result: ChatActivityOutput = await chatActivity(input);

      const aiMessage: Message = {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: result.aiResponse,
        activities: result.foundActivities as Activity[] || [],
        timestamp: new Date(),
        avatarUrl: agent.icono_principal, // Use active agent's icon
        avatarHint: agent.rol,
        quickReplies: result.quickReplies || [],
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
      
      if (result.navigationAction?.route) {
        // The user sees the confirmation message in the chat bubble.
        // A short delay before navigating provides better user experience.
        setTimeout(() => {
          router.push(result.navigationAction!.route);
        }, 1000); // 1-second delay
      }

    } catch (error) {
      console.error("Error calling AI chat flow:", error);
      toast({
        title: "Error de IA",
        description: "No se pudo obtener una respuesta del asistente. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      const errorResponseMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: "Lo siento, tuve un problema al procesar tu solicitud. ¿Podrías intentarlo de nuevo?",
        timestamp: new Date(),
        avatarUrl: agent.icono_secundario,
        avatarHint: "error icon",
      };
      setMessages((prevMessages) => [...prevMessages, errorResponseMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
       {/* Chat Header */}
      <div className="p-3 border-b border-border flex items-center gap-3 shrink-0 h-[var(--header-height)]">
        <Avatar className="h-10 w-10">
            <AvatarImage src={agent.icono_principal} alt={`${agent.nombre} Avatar`} data-ai-hint={agent.rol} />
            <AvatarFallback className="bg-transparent"><Bot size={24} className="text-muted-foreground" /></AvatarFallback>
        </Avatar>
        <div>
            <h2 className="text-base font-headline text-foreground leading-tight">
                {agent.nombre}
            </h2>
            <p className="text-xs text-muted-foreground leading-tight">{agent.rol}</p>
        </div>
      </div>
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
               <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={agent.icono_principal} alt={`${agent.nombre} Avatar`} data-ai-hint={agent.rol} />
                <AvatarFallback className="bg-transparent"><Bot size={40} className="text-muted-foreground" /></AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                ¡Hola! Soy {agent.nombre}. <AnimateWave />
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {agent.rol}. ¿En qué puedo ayudarte hoy?
              </p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-3 w-full',
                message.role === 'user' ? 'justify-start' : 'justify-end'
              )}
            >
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 border-2 border-muted-foreground/30 shrink-0">
                  {message.avatarUrl ? (
                      <AvatarImage src={message.avatarUrl} alt="User Avatar" data-ai-hint={message.avatarHint || "user profile"} />
                  ) : null }
                  <AvatarFallback className="bg-muted text-muted-foreground">
                      {message.userFallbackName || <UserIcon size={16}/>}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={cn(
                  "flex flex-col w-full",
                  message.role === 'user' ? 'items-start' : 'items-end'
              )}>
                {message.role === 'user' && message.content && (
                  <div
                    className={cn(
                      'max-w-[85%] rounded-xl px-4 py-2.5 text-sm shadow-sm bg-primary text-primary-foreground',
                      'rounded-bl-none'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-1.5 text-primary-foreground/80 text-left">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}

                {message.role === 'assistant' && (
                  <>
                    {message.content && (
                      <div
                        className={cn(
                          'max-w-[85%] rounded-xl px-4 py-2.5 text-sm shadow-sm bg-muted text-foreground',
                          'rounded-br-none'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                         <p className="text-xs mt-1.5 text-muted-foreground/80 text-right">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}

                    {message.activities && message.activities.length > 0 && (
                      <div className="mt-2 flex flex-col items-end w-full space-y-2">
                        {message.activities.map((activity) => (
                          <ChatActivityCard key={activity.id} activity={activity} />
                        ))}
                      </div>
                    )}
                    
                    {message.quickReplies && message.quickReplies.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 justify-end max-w-[85%]">
                            {message.quickReplies.map((reply, index) => (
                                <Button
                                    key={`${message.id}-reply-${index}`}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSendMessage(reply)}
                                    className="h-auto py-1 px-3 text-sm"
                                >
                                    {reply}
                                </Button>
                            ))}
                        </div>
                    )}
                  </>
                )}
              </div>

              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 border-2 border-primary/50 shrink-0 mt-1">
                  {message.avatarUrl && <Image src={message.avatarUrl} alt="UNI2" width={32} height={32} data-ai-hint={message.avatarHint || 'emoticon assistant'}/>}
                  <AvatarFallback className="bg-primary/10"><Bot size={16} className="text-primary"/></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 justify-end">
              <div className="bg-muted text-foreground rounded-xl px-4 py-2.5 text-sm shadow-sm rounded-br-none">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
              <Avatar className="h-8 w-8 border-2 border-primary/50 shrink-0 mt-1">
                <Image src={agent.icono_secundario} alt={`${agent.nombre} Pensando`} width={32} height={32} data-ai-hint={agent.rol} />
                <AvatarFallback className="bg-primary/10"><Bot size={16} className="text-primary"/></AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-3 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Escribe tu mensaje a ${agent.nombre}...`}
            className="flex-grow bg-background focus-visible:ring-1 focus-visible:ring-ring border-input text-sm"
            disabled={isLoading || authLoading}
            autoFocus
          />
          <Button type="submit" variant="ghost" size="icon" disabled={isLoading || authLoading || !inputValue.trim()} className="shrink-0 text-muted-foreground hover:text-foreground">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
