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
    <i className="ri-mic-line text-lg"></i>
);

// Custom Stop Icon component with smooth transitions
const StopIcon = ({ className }: { className?: string }) => (
    <i className="ri-mic-ai-line text-lg"></i>
);

interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
    onStopListening?: () => void;
    disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    onTranscription,
    onStopListening,
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
                            <i className="ri-mic-2-line"></i>
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
                            <i className="ri-mic-2-line"></i>
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
        
        // Notify parent component that listening has stopped
        onStopListening?.();
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
                        className={`h-8 w-8 shadow-none object-contain p-0 bg-transparent border-none rounded-full flex items-center justify-center transition-all duration-300 ease-in-out ${getButtonClass()}`}
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