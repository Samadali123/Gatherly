import { Clipboard, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';

export default function RoomLinkShare({ url }) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-primary p-6 shadow-card">
      <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-text-secondary">Room ready</p>
      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="break-all rounded-xl border border-border-default bg-bg-secondary px-4 py-3 text-[14px] text-text-primary">{url}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-[14px] font-medium text-white transition hover:bg-brand-hover active:scale-95 active:bg-brand-pressed"
              onClick={() => window.navigator.clipboard.writeText(url)}
              type="button"
            >
              <Clipboard size={16} strokeWidth={1.5} />
              Copy link
            </button>
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-default bg-white px-4 py-2 text-[14px] font-medium text-text-primary transition hover:border-brand-primary hover:bg-brand-subtle"
              to={new URL(url).pathname}
            >
              <ExternalLink size={16} strokeWidth={1.5} />
              Join room
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-border-default bg-white p-4">
          <QRCodeSVG size={144} value={url} />
        </div>
      </div>
    </div>
  );
}
