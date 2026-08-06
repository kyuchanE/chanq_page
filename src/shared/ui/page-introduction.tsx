type PageIntroductionProps = Readonly<{
  description: string;
  eyebrow: string;
  title: string;
}>;

export function PageIntroduction({
  description,
  eyebrow,
  title,
}: PageIntroductionProps) {
  return (
    <div className="page-introduction">
      <p className="page-introduction__eyebrow">{eyebrow}</p>
      <h1 className="page-introduction__title">{title}</h1>
      <p className="page-introduction__description">{description}</p>
    </div>
  );
}
