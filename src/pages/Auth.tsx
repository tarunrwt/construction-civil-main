import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Mail, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Auth = (): JSX.Element => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResendDialog, setShowResendDialog] = useState(false);
  const [resendEmail, setResendEmail] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/admin");
      }
    });
  }, [navigate]);

  const handleResendConfirmation = async (e: FormEvent) => {
    e.preventDefault();
    if (!resendEmail) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: resendEmail,
      });

      if (error) {
        console.error("[supabase][resend] error", error);
        toast.error(error.message);
      } else {
        toast.success("Confirmation email sent! Please check your inbox.");
        setShowResendDialog(false);
      }
    } catch (err) {
      console.error("[supabase][resend] unexpected error", err);
      toast.error("Failed to resend confirmation email");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();

    // Trim the email to avoid accidental leading/trailing spaces from user input
    const emailTrimmed = email.trim();

    if (!emailTrimmed || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Debug info (safe): log the email being used and the password length, but never the password itself
    // This will appear in the browser console and helps diagnose issues like accidental whitespace or empty values.
    // Remove or disable in production if you prefer.
    // eslint-disable-next-line no-console
    console.debug('[auth] signIn attempt', { email: emailTrimmed, passwordLength: password.length });

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password,
      });

      if (error) {
        // eslint-disable-next-line no-console
        console.error("[supabase][signin] auth error", error);
        
        // Check specific error cases
        if (error.message?.toLowerCase().includes("email not confirmed")) {
          toast.error("Please check your email and click the confirmation link before signing in");
          setShowResendDialog(true);
        } else if (error.message?.toLowerCase().includes("invalid login credentials")) {
          toast.error("Invalid email or password. If you just signed up, please confirm your email first.");
        } else {
          const status = (error as any).status || (error as any).statusCode || "";
          toast.error(`${error.message || "Sign in failed"}${status ? ` (status: ${status})` : ""}`);
        }
        return;
      }

      toast.success("Signed in successfully!");
      navigate("/admin");
    } catch (err) {
      // Log unexpected errors (network, serialization)
      // eslint-disable-next-line no-console
      console.error("[supabase][signin] unexpected error", err);
      toast.error("An unexpected error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (error) {
        // eslint-disable-next-line no-console
        console.error("[supabase][signup] auth error", error);
        
        if (error.message?.toLowerCase().includes("user already registered")) {
          toast.error("This email is already registered. Please sign in or reset your password.");
        } else {
          const status = (error as any).status || (error as any).statusCode || "";
          toast.error(`${error.message || "Sign up failed"}${status ? ` (status: ${status})` : ""}`);
        }
        return;
      }

      toast.success(
        "Account created! Please check your email for a confirmation link. You must confirm your email before signing in."
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[supabase][signup] unexpected error", err);
      toast.error("An unexpected error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("[supabase][reset] error", error);
        toast.error(error.message);
      } else {
        toast.success("Password reset email sent! Please check your inbox.");
      }
    } catch (err) {
      console.error("[supabase][reset] unexpected error", err);
      toast.error("Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-primary p-3 rounded-lg mr-3">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">BuildTrack</h1>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
                Welcome Back
              </h2>
              <p className="text-muted-foreground mb-6 text-center">
                Sign in to your account
              </p>

              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
                Create Account
              </h2>
              <p className="text-muted-foreground mb-6 text-center">
                Sign up for a new account
              </p>

              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      <Dialog open={showResendDialog} onOpenChange={setShowResendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Confirmation Email</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a new confirmation link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResendConfirmation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resend-email">Email</Label>
              <Input
                id="resend-email"
                type="email"
                placeholder="name@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowResendDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Resend"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;