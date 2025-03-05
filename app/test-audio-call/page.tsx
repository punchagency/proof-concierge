import { TestAudioCall } from '@/components/communication/TestAudioCall';

export default function TestAudioCallPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Audio Call Test Page</h1>
      <p className="mb-6 text-gray-600">
        This page allows you to test the audio call functionality by connecting to the backend.
        Make sure the backend server is running at {process.env.NEXT_PUBLIC_BACKEND_URL}.
      </p>
      
      <div className="max-w-md mx-auto">
        <TestAudioCall />
      </div>
    </div>
  );
} 