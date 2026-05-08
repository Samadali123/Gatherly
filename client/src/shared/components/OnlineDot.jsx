export default function OnlineDot({ online = false }) {
  return (
    <span
      className={`inline-flex h-3 w-3 rounded-full ring-2 ring-bg-primary transition ${
        online ? 'bg-status-online' : 'bg-border-default'
      }`}
    />
  );
}
