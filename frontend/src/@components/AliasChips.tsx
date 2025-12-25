export default function AliasChips({
  aliases,
  onAliasSelected,
  length,
}: {
  aliases: string[];
  onAliasSelected: (alias: string) => void;
  length: number;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-4 overflow-x-auto">
      {!aliases.length && length && (
        <>
          {Array.from({ length }).map((_, index) => (
            <SkeletonChip key={index} />
          ))}
        </>
      )}
      {aliases.map((alias) => (
        <span
          onClick={() => onAliasSelected(alias)}
          key={alias}
          className="bg-neutral-700 text-white px-3 py-1 rounded-lg cursor-pointer hover:bg-neutral-600"
        >
          {alias}
        </span>
      ))}
    </div>
  );
}

function SkeletonChip() {
  return <div className="bg-neutral-700 rounded-lg animate-pulse h-8 w-20" />;
}
