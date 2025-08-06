// client/src/App.tsx
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import { Route, Switch } from 'wouter';
import { Toaster } from "@/components/ui/toaster";

function App() {
  document.documentElement.classList.add('dark');

  return (
    <>
      {/* --- THIS IS THE KEY CHANGE --- 
          We fix the container to the screen height and prevent it from ever scrolling.
          The child components (Sidebar, ChatWindow) will now manage their own scrolling internally.
      */}
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Switch>
            <Route path="/c/:id">
              {params => <ChatWindow key={params.id} conversationId={params.id} />}
            </Route>
            <Route path="/">
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Office GPT</h1>
                  <p className="text-muted-foreground mt-2">Select a conversation or start a new one to begin.</p>
                </div>
              </div>
            </Route>
          </Switch>
        </main>
      </div>
      <Toaster />
    </>
  );
}

export default App;