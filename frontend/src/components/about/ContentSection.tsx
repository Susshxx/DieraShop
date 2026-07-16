interface ContentSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const ContentSection = ({ title, children, className = "" }: ContentSectionProps) => {
  return (
    <section className={`pr-6 py-6 ${className}`}>
      {title && (
        <h2 className="text-2xl font-light text-foreground mb-6">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
};

export default ContentSection;