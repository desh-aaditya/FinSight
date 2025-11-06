'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Check } from 'lucide-react';
import { TransactionCategory } from '@/types';
import { toast } from 'sonner';

interface VoiceInputProps {
  onTransactionAdd: (amount: number, category: TransactionCategory, description: string) => void;
}

export default function VoiceInput({ onTransactionAdd }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Listening...');
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      processVoiceCommand(text);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      toast.error('Failed to recognize speech. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processVoiceCommand = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Extract amount
    const amountMatch = lowerText.match(/(\d+)/);
    if (!amountMatch) {
      toast.error('Please include an amount in your command.');
      return;
    }
    
    const amount = parseInt(amountMatch[1]);
    
    // Detect category
    const categoryKeywords: Record<string, TransactionCategory> = {
      'food': 'Food & Dining',
      'groceries': 'Food & Dining',
      'restaurant': 'Food & Dining',
      'dining': 'Food & Dining',
      'electronics': 'Electronics',
      'laptop': 'Electronics',
      'phone': 'Electronics',
      'transport': 'Transportation',
      'uber': 'Transportation',
      'taxi': 'Transportation',
      'gas': 'Transportation',
      'bill': 'Utilities & Bills',
      'electricity': 'Utilities & Bills',
      'water': 'Utilities & Bills',
      'entertainment': 'Entertainment',
      'movie': 'Entertainment',
      'netflix': 'Entertainment',
      'health': 'Healthcare',
      'doctor': 'Healthcare',
      'medicine': 'Healthcare',
      'education': 'Education',
      'course': 'Education',
      'book': 'Education',
    };
    
    let category: TransactionCategory = 'Other';
    for (const [keyword, cat] of Object.entries(categoryKeywords)) {
      if (lowerText.includes(keyword)) {
        category = cat;
        break;
      }
    }
    
    onTransactionAdd(amount, category, text);
    
    toast.success(`Transaction Added: ₹${amount} spent on ${category}`);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <h3 className="font-semibold">Voice Transaction Input</h3>
          <p className="text-sm text-muted-foreground">
            Say: "Add 500 spent on groceries today"
          </p>
          
          <Button
            size="lg"
            onClick={startListening}
            disabled={isListening}
            className={`w-full ${isListening ? 'animate-pulse' : ''}`}
          >
            {isListening ? (
              <>
                <MicOff className="mr-2 h-5 w-5" />
                Listening...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-5 w-5" />
                Start Voice Input
              </>
            )}
          </Button>
          
          {transcript && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 text-green-600" />
                <p>{transcript}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}