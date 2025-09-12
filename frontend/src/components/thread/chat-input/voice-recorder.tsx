import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Image from 'next/image';

// Custom Voice Icon component with smooth transitions
const VoiceIcon = ({ className }: { className?: string }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-300 ease-in-out ${className}`}
  >
    <path d="M5 7H7V17H5V7ZM1 10H3V14H1V10ZM9 2H11V20H9V2ZM13 4H15V22H13V4ZM17 7H19V17H17V7ZM21 10H23V14H21V10Z"></path>
  </svg>
);

// Custom Stop Icon component with smooth transitions
const StopIcon = ({ className }: { className?: string }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-300 ease-in-out ${className}`}
  >
    <path d="M20.7134 7.12811L20.4668 7.69379C20.2864 8.10792 19.7136 8.10792 19.5331 7.69379L19.2866 7.12811C18.8471 6.11947 18.0555 5.31641 17.0677 4.87708L16.308 4.53922C15.8973 4.35653 15.8973 3.75881 16.308 3.57612L17.0252 3.25714C18.0384 2.80651 18.8442 1.97373 19.2761 0.930828L19.5293 0.319534C19.7058 -0.106511 20.2942 -0.106511 20.4706 0.319534L20.7238 0.930828C21.1558 1.97373 21.9616 2.80651 22.9748 3.25714L23.6919 3.57612C24.1027 3.75881 24.1027 4.35653 23.6919 4.53922L22.9323 4.87708C21.9445 5.31641 21.1529 6.11947 20.7134 7.12811ZM8.5 6H6.5V18H8.5V6ZM4 10H2V14H4V10ZM13 2H11V22H13V2ZM17.5 8H15.5V18H17.5V8ZM22 10H20V14H22V10Z"></path>
  </svg>
);

interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
    disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    onTranscription,
    disabled = false,
}) => {
    const { theme } = useTheme();
    const [isListening, setIsListening] = useState(false);
    const lastTranscriptRef = useRef<string>('');
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable
    } = useSpeechRecognition();

    // Real-time transcription feedback with minimal debouncing
    useEffect(() => {
        if (isListening && transcript.trim()) {
            // Clear any existing timeout
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
            
            // Set a new timeout to send the complete transcript
            updateTimeoutRef.current = setTimeout(() => {
                const currentTranscript = transcript.trim();
                if (currentTranscript !== lastTranscriptRef.current) {
                    lastTranscriptRef.current = currentTranscript;
                    onTranscription(currentTranscript);
                }
            }, 150); // Reduced to 150ms for more responsive updates
        }
        
        // Cleanup timeout on unmount or when not listening
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, [transcript, isListening, onTranscription]);

    // Check if browser supports speech recognition
    if (!browserSupportsSpeechRecognition) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={true}
                            className="h-8 px-2 py-2 bg-transparent border-0 rounded-full text-muted-foreground opacity-50 cursor-not-allowed"
                        >
                            <Image
                                src="/icons/mic-light.svg"
                                alt="mic Light Logo"
                                width={20}
                                height={20}
                                className="block dark:hidden mb-0"
                            />
                            <Image
                                src="/icons/mic-dark.svg"
                                alt="mic Dark Logo"
                                width={20}
                                height={20}
                                className="hidden dark:block mb-0"
                            />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        <p>Speech recognition not supported in this browser</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Check if microphone is available
    if (!isMicrophoneAvailable) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={true}
                            className="h-8 px-2 py-2 bg-transparent border-0 rounded-xl text-muted-foreground opacity-50 cursor-not-allowed"
                        >
                            <Image
                                src="/icons/mic-light.svg"
                                alt="mic Light Logo"
                                width={20}
                                height={20}
                                className="block dark:hidden mb-0"
                            />
                            <Image
                                src="/icons/mic-dark.svg"
                                alt="mic Dark Logo"
                                width={20}
                                height={20}
                                className="hidden dark:block mb-0"
                            />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        <p>Microphone access required</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    const handleStartListening = () => {
        setIsListening(true);
        lastTranscriptRef.current = '';
        resetTranscript();
        SpeechRecognition.startListening({ 
            continuous: true,
            language: 'en-US'
        });
    };

    const handleStopListening = () => {
        setIsListening(false);
        SpeechRecognition.stopListening();
        
        // Clear any pending timeout
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
            updateTimeoutRef.current = null;
        }
        
        // Send final transcript if there's any
        if (transcript.trim() && transcript.trim() !== lastTranscriptRef.current) {
            onTranscription(transcript.trim());
        }
        
        // Reset transcript for next use
        resetTranscript();
        lastTranscriptRef.current = '';
    };

    const handleClick = () => {
        if (isListening) {
            handleStopListening();
        } else {
            handleStartListening();
        }
    };

    const getButtonClass = () => {
        if (isListening) {
            return 'text-helium-orange';
        }
        return 'text-muted-foreground hover:text-foreground hover:bg-background/50';
    };

    const getIcon = () => {
        if (isListening) {
            return <StopIcon className="mb-0 transform scale-110" />;
        }
        return <VoiceIcon className="mb-0" />;
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClick}
                        disabled={disabled}
                        className={`h-8 w-8 shadow-none object-contain p-0 bg-transparent border dark:border-muted-foreground/20 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out ${getButtonClass()}`}
                    >
                        {getIcon()}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                    <p>
                        {isListening 
                            ? 'Click to stop recording' 
                            : 'Record voice message'
                        }
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}; 