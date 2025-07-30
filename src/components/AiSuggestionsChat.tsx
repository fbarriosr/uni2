
'use client';
import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, User as UserIcon, Bot, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { chatActivity, type ChatActivityInput, type ChatActivityOutput } from '@/ai/flows/chat-activity-flow';
import type { Activity, User as AppUser, Agent } from '@/lib/types';
import ChatActivityCard from './ChatActivityCard';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getUserById } from '@/lib/data';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';


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
  activeAgent: Agent | null;
  agents: Agent[];
  setActiveAgent: (agent: Agent) => void;
  isLoading: boolean;
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


export default function AiSuggestionsChat({ activeAgent, agents, setActiveAgent, isLoading: isLoadingAgents }: AiSuggestionsChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = React.useState(false);

  // When agent changes, clear the chat history
  useEffect(() => {
    setMessages([]);
  }, [activeAgent]);


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
      setTimeout(() => {
        if(scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (eOrText: React.FormEvent<HTMLFormElement> | string) => {
    let textInput: string;
    if (typeof eOrText === 'string') {
        textInput = eOrText;
    } else {
        eOrText.preventDefault();
        textInput = inputValue;
    }

    const trimmedInput = textInput.trim();
    if (!trimmedInput || !activeAgent) return;

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
      quickReplies: [],
    };

    const historyForAi = messages.map(m => ({
        role: m.role,
        content: m.content || '',
    }));
    historyForAi.push({
        role: 'user',
        content: trimmedInput
    });

    setMessages((prevMessages) => [...prevMessages, userMessageForUi]);
    setIsLoading(true);

    try {
      const input: ChatActivityInput = {
        history: historyForAi,
        userId: currentUser?.id,
        systemPrompt: activeAgent.prompt,
      };
      const result: ChatActivityOutput = await chatActivity(input);

      const aiMessage: Message = {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: result.aiResponse,
        activities: result.foundActivities || [],
        timestamp: new Date(),
        avatarUrl: activeAgent.icono_principal,
        avatarHint: activeAgent.rol,
        quickReplies: result.quickReplies || [],
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);

      if (result.navigationAction?.route) {
        setTimeout(() => {
          router.push(result.navigationAction!.route);
        }, 1000);
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
        avatarUrl: activeAgent.icono_secundario,
        avatarHint: "error icon",
        quickReplies: [],
      };
      setMessages((prevMessages) => [...prevMessages, errorResponseMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleAgentSelect = (selectedAgent: Agent) => {
    setActiveAgent(selectedAgent);
    setIsAgentSelectorOpen(false);
  };

  if (!activeAgent) {
     return (
        <div className="flex flex-col h-full bg-card shadow-xl overflow-hidden items-center justify-center p-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Cargando agente...</p>
        </div>
     );
  }


  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
               <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={activeAgent.icono_principal} alt={`${activeAgent.nombre} Avatar`} data-ai-hint={activeAgent.rol} />
                <AvatarFallback className="bg-transparent"><Bot size={40} className="text-muted-foreground" /></AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                ¡Hola! Soy {activeAgent.nombre}. <AnimateWave />
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {activeAgent.rol}. ¿En qué puedo ayudarte hoy?
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
                <Image src={activeAgent.icono_secundario} alt={`${activeAgent.nombre} Pensando`} width={32} height={32} data-ai-hint={activeAgent.rol} />
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
            placeholder={`Escribe tu mensaje a ${activeAgent.nombre}...`}
            className="flex-grow bg-background focus-visible:ring-1 focus-visible:ring-ring border-input text-sm"
            disabled={isLoading || authLoading}
            autoFocus
          />
          <Button type="submit" variant="ghost" size="icon" disabled={isLoading || authLoading || !inputValue.trim()} className="shrink-0 text-muted-foreground hover:text-foreground">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
        {isLoadingAgents ? (
            <div className="flex items-center justify-center h-9 mt-2">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
        ) : activeAgent && agents && agents.length > 0 ? (
             <Popover open={isAgentSelectorOpen} onOpenChange={setIsAgentSelectorOpen}>
              <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={isAgentSelectorOpen} className="w-full justify-start h-9 font-normal mt-2">
                      <div className="flex items-center gap-2 truncate flex-grow">
                          <Avatar className="h-6 w-6">
                              <AvatarImage src={activeAgent.icono_principal} />
                              <AvatarFallback />
                          </Avatar>
                          <span className="truncate text-sm">{activeAgent.nombre}</span>
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0 z-50 mb-1">
                   <Command>
                      <CommandList>
                          <CommandGroup>
                              {agents.map((agentItem) => (
                              <CommandItem
                                  key={agentItem.id}
                                  onSelect={() => handleAgentSelect(agentItem)}
                                  className="flex items-center gap-2 cursor-pointer text-sm"
                              >
                                  <Avatar className="h-6 w-6">
                                      <AvatarImage src={agentItem.icono_principal} />
                                      <AvatarFallback />
                                  </Avatar>
                                  <span className="flex-grow truncate">{agentItem.nombre}</span>
                                  <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        activeAgent?.id === agentItem.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                              </CommandItem>
                              ))}
                          </CommandGroup>
                      </CommandList>
                  </Command>
              </PopoverContent>
          </Popover>
        ) : null }
      </div>
    </div>
  );
}
