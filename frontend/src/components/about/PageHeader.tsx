interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  return (
    <header className="py-4 mb-6 border-b border-border">
      <h1 className="text-3xl md:text-4xl font-light text-foreground mb-2">
        {title}
      </h1>
      {subtitle && (
        <p className="text-base text-muted-foreground max-w-2xl">
          {subtitle}
        </p>
      )}
    </header>
  );
};

export default PageHeader;