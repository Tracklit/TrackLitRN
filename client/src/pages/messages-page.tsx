import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Search, 
  Plus, 
  User, 
  Users, 
  Send, 
  Paperclip, 
  MoreHorizontal, 
  Image, 
  Video, 
  File
} from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  
  // Placeholder data
  const conversations = [
    { id: 1, name: "Track Stars Group", isGroup: true, lastMessage: "Coach: Don't forget about tomorrow's practice!", time: "10:35 AM", unread: 2 },
    { id: 2, name: "Sam Wilson", isGroup: false, lastMessage: "Looking forward to the meet this weekend!", time: "Yesterday", unread: 0 },
    { id: 3, name: "Distance Runners", isGroup: true, lastMessage: "You: What time are we meeting?", time: "Wednesday", unread: 0 },
  ];
  
  const activeConversation = conversations[0];
  
  const messages = [
    { id: 1, senderId: 101, sender: "Coach Johnson", time: "10:30 AM", content: "Good morning everyone!" },
    { id: 2, senderId: 101, sender: "Coach Johnson", time: "10:32 AM", content: "We have a schedule change for this week." },
    { id: 3, senderId: 102, sender: "Lisa Chen", time: "10:33 AM", content: "What's the change?" },
    { id: 4, senderId: 101, sender: "Coach Johnson", time: "10:35 AM", content: "Don't forget about tomorrow's practice! We'll be focusing on starts and block technique." },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // In a real app, this would dispatch an action to send the message
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  return (
    <div className="container max-w-screen-xl mx-auto px-0 md:px-4 pt-16 md:pt-24 md:pl-72 pb-16 h-screen flex flex-col">
      <div className="px-4">
        <PageHeader
          title="Messages"
          description="Chat with athletes, coaches, and groups"
          action={
            <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts or groups"
                    className="pl-8"
                  />
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Recent</h3>
                  <div className="space-y-2">
                    {[
                      { id: 1, name: "Sam Wilson", type: "contact" },
                      { id: 2, name: "Track Stars Group", type: "group" },
                      { id: 3, name: "Coach Johnson", type: "contact" },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 cursor-pointer">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
                          </Avatar>
                          <span>{item.name}</span>
                        </div>
                        {item.type === "group" ? (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }
        />
      </div>

      <div className="flex flex-1 overflow-hidden mt-4 border rounded-md mx-4">
        {/* Conversation list */}
        <div className="w-full md:w-80 border-r hidden md:block">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-220px)]">
            {conversations.map((conversation) => (
              <div 
                key={conversation.id}
                className={`p-3 hover:bg-accent/10 cursor-pointer border-b flex items-center ${
                  activeConversation.id === conversation.id ? "bg-accent/20" : ""
                }`}
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback>{getInitials(conversation.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm truncate">{conversation.name}</h3>
                    <span className="text-xs text-muted-foreground">{conversation.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                </div>
                {conversation.unread > 0 && (
                  <div className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {conversation.unread}
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback>{getInitials(activeConversation.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-medium">{activeConversation.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {activeConversation.isGroup ? "Group chat" : "Direct message"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col">
                  <div className="flex items-baseline">
                    <span className="font-medium text-sm">{msg.sender}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{msg.time}</span>
                  </div>
                  <div className="mt-1 bg-accent/10 rounded-lg p-3 inline-block max-w-[80%]">
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {/* Message input */}
          <div className="p-3 border-t flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Paperclip className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>
                  <Image className="h-4 w-4 mr-2" />
                  <span>Image</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Video className="h-4 w-4 mr-2" />
                  <span>Video</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <File className="h-4 w-4 mr-2" />
                  <span>File</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Input 
              className="mx-2" 
              placeholder="Type a message" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            
            <Button 
              size="icon" 
              disabled={!message.trim()} 
              onClick={handleSendMessage}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/messages" component={MessagesPage} />
  );
}