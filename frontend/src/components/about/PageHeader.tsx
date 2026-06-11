interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  return (
    <header className="py-8 mb-8 border-b border-border">
      <h1 className="text-3xl md:text-4xl font-light text-foreground mb-3">
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