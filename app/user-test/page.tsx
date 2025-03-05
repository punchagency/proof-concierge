import { Metadata } from "next";
import UserQueryList from "@/components/user-test/UserQueryList";

export const metadata: Metadata = {
  title: "User Test Interface",
  description: "Test interface for users to chat and handle calls",
};

export default function UserTestPage() {
  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">User Test Interface</h1>
          <p className="text-gray-600">View and manage your queries, chat with admins, and handle call requests.</p>
        </div>
        
        <UserQueryList />
      </div>
    </main>
  );
} 