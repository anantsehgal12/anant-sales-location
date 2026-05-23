import { Show, SignInButton, useUser, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { isAdmin } from "@/lib/isAdmis";
import { Button } from "@/components/ui/button";

function Navbar() {
  const {user} = useUser();
  return (
    <header className="h-20 flex items-center top-0 z-50 w-full border-b border-white/[0.08] bg-[#0a0c10]/80 backdrop-blur-md text-slate-200">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="flex items-center gap-3 sm:gap-5 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tighter text-white">
           <img src="https://uacqmejpbzojibsrtift.supabase.co/storage/v1/object/sign/logos&all/AS.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yOWY1YzVhZi04NmVjLTQ4ZmItYjFmOS1mY2NmZTlmODA1MTgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvcyZhbGwvQVMucG5nIiwiaWF0IjoxNzc5NTMxNzgyLCJleHAiOjg4MTc5NDQ1MzgyfQ.JIqeZl_TP89znbzUq0Q_M1WCOMP6fnOEYeS1V3nVXbY" alt="Anant Sales Logo" width={32} height={32} className="rounded-full w-6 h-6 sm:w-8 sm:h-8" />
            
            <span className="bg-clip-text font-display text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
              Anant Sales
            </span>
          </Link>
          {isAdmin(user) && (
            <nav className="hidden md:flex gap-6">
              <Link href="/admin" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Admin Dashboard
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Show when="signed-out">
            <SignInButton>
              <Button className="px-4 text-xs sm:px-6 sm:text-sm">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button variant="outline" className="hidden sm:inline-flex px-6">
                Sign Up
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center gap-3 sm:gap-4">
              {isAdmin(user) && (
                <Link href="/admin" className="md:hidden text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  Admin
                </Link>
              )}
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 sm:w-9 sm:h-9 border border-white/10" } }} />
            </div>
          </Show>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
