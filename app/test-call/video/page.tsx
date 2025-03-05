'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Add a type definition for the Daily.co iframe
declare global {
  interface Window {
    DailyIframe: any;
  }
}

export default function TestVideoCallPage() {
  const [roomUrl, setRoomUrl] = useState('');
  const [roomToken, setRoomToken] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [callFrame, setCallFrame] = useState<any>(null);

  // Load the Daily.co script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@daily-co/daily-js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Function to join a call with the provided URL and token
  const joinCall = () => {
    if (!roomUrl) {
      alert('Please enter a room URL');
      return;
    }

    if (!window.DailyIframe) {
      alert('Daily.co script is not loaded yet. Please try again in a moment.');
      return;
    }

    try {
      console.log('Creating call frame with:', { roomUrl, hasToken: !!roomToken });
      
      // Create the call frame
      const frame = window.DailyIframe.createFrame({
        url: roomUrl,
        token: roomToken || undefined,
        showLeaveButton: true,
        iframeStyle: {
          position: 'fixed',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          border: 'none',
          background: '#f8f8f8'
        }
      });

      // Join the call
      console.log('Attempting to join call...');
      frame.join()
        .then(() => {
          console.log('Successfully joined the call');
          setIsCallActive(true);
          setCallFrame(frame);
        })
        .catch((error: any) => {
          console.error('Error joining call:', error);
          alert(`Failed to join call: ${error.message || 'Unknown error'}`);
        });
    } catch (error: any) {
      console.error('Error creating call frame:', error);
      alert(`Failed to create call frame: ${error.message || 'Unknown error'}`);
    }
  };

  // Function to end the current call
  const endCall = () => {
    if (callFrame) {
      callFrame.destroy();
      setCallFrame(null);
    }
    setIsCallActive(false);
  };

  // Clean up the call frame when the component unmounts
  useEffect(() => {
    return () => {
      if (callFrame) {
        callFrame.destroy();
      }
    };
  }, [callFrame]);

  // Get URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const url = params.get('url');
      const token = params.get('token');
      
      console.log('URL parameters:', { url, token });
      
      if (url) {
        setRoomUrl(url);
      }
      
      if (token) {
        setRoomToken(token);
      }
      
      // Auto-join if both URL and token are provided
      if (url) {
        // Wait for the Daily.co script to load
        const checkDailyInterval = setInterval(() => {
          if (window.DailyIframe) {
            clearInterval(checkDailyInterval);
            console.log('Daily.co script loaded, attempting to join call');
            // Small delay to ensure state is updated
            setTimeout(joinCall, 500);
          } else {
            console.log('Waiting for Daily.co script to load...');
          }
        }, 500);
        
        // Clear the interval after 10 seconds to prevent infinite checking
        setTimeout(() => {
          clearInterval(checkDailyInterval);
          if (!window.DailyIframe) {
            console.error('Daily.co script failed to load after 10 seconds');
            alert('Failed to load Daily.co script. Please refresh the page and try again.');
          }
        }, 10000);
      }
    }
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Video Call</h1>
      
      {!isCallActive ? (
        <div className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="roomUrl">Room URL</Label>
              <Input
                id="roomUrl"
                value={roomUrl}
                onChange={(e) => setRoomUrl(e.target.value)}
                placeholder="https://prooftest.daily.co/your-room-name"
                className="w-full"
              />
            </div>
            
            <div>
              <Label htmlFor="roomToken">Room Token (optional)</Label>
              <Input
                id="roomToken"
                value={roomToken}
                onChange={(e) => setRoomToken(e.target.value)}
                placeholder="Enter the room token if required"
                className="w-full"
              />
            </div>
          </div>
          
          <Button onClick={joinCall} className="w-full">
            Join Call
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-4">Call is active. The call interface should appear above.</p>
          <Button onClick={endCall} variant="destructive">
            End Call
          </Button>
        </div>
      )}
    </div>
  );
} 