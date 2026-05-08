import Spinner from './Spinner';

export default function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <Spinner size="lg" />
    </div>
  );
}
