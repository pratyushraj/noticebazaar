import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Simple Framer Motion implementation to avoid Radix UI dependency if it's missing
const Accordion = ({ children, className, type = "single", collapsible = true, defaultValue }: any) => {
    const [openItem, setOpenItem] = React.useState(defaultValue || null);

    const toggleItem = (value: string) => {
        if (openItem === value) {
            if (collapsible) setOpenItem(null);
        } else {
            setOpenItem(value);
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, {
                        isOpen: openItem === child.props.value,
                        onToggle: () => toggleItem(child.props.value),
                    });
                }
                return child;
            })}
        </div>
    );
};

const AccordionItem = ({ children, className, isOpen, onToggle, value }: any) => {
    return (
        <div className={cn("border-b border-slate-200", className)}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, {
                        isOpen,
                        onToggle,
                    });
                }
                return child;
            })}
        </div>
    );
};

const AccordionTrigger = ({ children, className, isOpen, onToggle }: any) => {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                "flex flex-1 items-center justify-between py-4 font-medium transition-all w-full text-left",
                className
            )}
        >
            {children}
            <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
            >
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform" />
            </motion.div>
        </button>
    );
};

const AccordionContent = ({ children, className, isOpen }: any) => {
    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className={cn("pb-4 pt-0", className)}>{children}</div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
