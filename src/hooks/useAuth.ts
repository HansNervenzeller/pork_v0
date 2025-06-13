import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const useAuth = () => {
    const [isDealer, setIsDealer] = useState(false);
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [showAccessButton, setShowAccessButton] = useState(true);
    const [accessCode, setAccessCode] = useState("");
    const { toast } = useToast();

    const handleAccessCode = () => {
        if (accessCode === "1211") {
            setIsDealer(true);
            setShowCodeInput(false);
            setShowAccessButton(false);
            toast({
                title: "Access Granted",
                description: "You are now the dealer with full access",
            });
        } else {
            toast({
                title: "Invalid Code",
                description: "Incorrect access code",
                variant: "destructive",
            });
        }
        setAccessCode("");
    };

    const switchToViewer = () => {
        setIsDealer(false);
        setShowAccessButton(true);
    };

    const showCodeInputForm = () => {
        setShowCodeInput(true);
        setShowAccessButton(false);
    };

    const hideCodeInputForm = () => {
        setShowCodeInput(false);
        setShowAccessButton(true);
        setAccessCode("");
    };

    return {
        isDealer,
        showCodeInput,
        showAccessButton,
        accessCode,
        setAccessCode,
        handleAccessCode,
        switchToViewer,
        showCodeInputForm,
        hideCodeInputForm,
    };
};
