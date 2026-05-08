import Badge from '../../../shared/components/Badge';

export default function GroupList({ count }) {
  return (
    <div className="px-4 pb-4 pt-2">
      <Badge>{count} groups</Badge>
    </div>
  );
}
