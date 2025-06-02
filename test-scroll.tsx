import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

// Temporary test component to verify scroll functionality
export default function TestScrollComponent() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []); // Test with empty dependency for now

  // Handle scroll to detect if user scrolled up
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
      setShowScrollButton(!isAtBottom);
      console.log('Scroll detected:', { scrollTop, scrollHeight, clientHeight, isAtBottom });
    }
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Generate test messages
  const testMessages = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    content: `Test message ${i + 1} - This is a longer message to create scroll content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
    role: i % 2 === 0 ? 'user' : 'assistant'
  }));

  return (
    <div style={{ height: '400px', width: '100%', position: 'relative', border: '1px solid #ccc' }}>
      <h3>Test Scroll Component</h3>
      
      {/* Regular div with overflow scroll instead of ScrollArea */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          height: '350px',
          overflowY: 'auto',
          padding: '20px',
          backgroundColor: '#f5f5f5'
        }}
      >
        {testMessages.map((message) => (
          <div 
            key={message.id} 
            style={{
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: message.role === 'user' ? '#e3f2fd' : '#fff3e0',
              borderRadius: '8px'
            }}
          >
            <strong>{message.role}:</strong> {message.content}
          </div>
        ))}
      </div>
      
      {/* Floating scroll to bottom button */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            color: 'white',
            zIndex: 10
          }}
        >
          <ArrowDown style={{ width: '20px', height: '20px' }} />
        </Button>
      )}
      
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        Scroll button visible: {showScrollButton ? 'YES' : 'NO'}
      </div>
    </div>
  );
}