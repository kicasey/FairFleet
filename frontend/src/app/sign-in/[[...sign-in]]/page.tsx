import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-off">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#2875F1',
            colorBackground: '#FFFFFF',
            colorText: '#0A1628',
            colorInputBackground: '#F4F7FA',
            borderRadius: '14px',
          },
          elements: {
            formButtonPrimary: "bg-[#2875F1] hover:bg-[#0C1464]",
            footerActionLink: "text-[#2875F1] hover:text-[#0C1464]",
            card: "border border-[#D4DDE8] shadow-lg",
          },
        }}
      />
    </div>
  );
}
