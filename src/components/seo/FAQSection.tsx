import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FAQSchema } from './SchemaMarkup';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  items: FAQItem[];
  title?: string;
  description?: string;
  className?: string;
  containerClassName?: string;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  items,
  title = "Frequently Asked Questions",
  description = "Find answers to common questions about Creator Armour and our services.",
  className,
  containerClassName,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <section className={cn("py-16 md:py-24", containerClassName)}>
      {/* Schema Markup */}
      <FAQSchema faqs={items} />
      
      <div className={cn("max-w-3xl mx-auto px-6", className)}>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-4 italic uppercase">
            {title}
          </h2>
          <p className="text-muted-foreground font-medium max-w-xl mx-auto">
            {description}
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {items.map((item, index) => (
            <AccordionItem 
              key={index} 
              value={`faq-${index}`}
              className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl px-6 overflow-hidden data-[state=open]:border-primary/50 transition-all"
            >
              <AccordionTrigger className="text-left font-bold text-lg hover:no-underline py-6">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-medium leading-relaxed pb-6">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
