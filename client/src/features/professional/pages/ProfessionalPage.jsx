import { Download, MonitorUp, PenLine, ShieldCheck, Users, Video } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const plans = [
  { name: 'Personal', price: 'Free', limit: 'Up to 10 room members', details: 'Chat, anonymous rooms, status, and attachments.' },
  { name: 'Professional', price: '$12 / seat', limit: 'Teams, meetings, whiteboard', details: 'Room meetings, collaborative boards, exports, admin controls.' },
  { name: 'Business', price: 'Custom', limit: 'Compliance and scale', details: 'SAML, audit logs, retention, priority support, industry workspaces.' },
];

export default function ProfessionalPage() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  const point = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (event) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = point(event);
    ctx.strokeStyle = '#245143';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  };

  const draw = (event) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = point(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const downloadBoard = () => {
    const url = canvasRef.current?.toDataURL('image/png');
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gatherly-whiteboard.png';
    link.click();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl border border-border-default bg-bg-primary p-6 shadow-card">
          <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-text-secondary">Professional workspace</p>
          <h2 className="mt-3 font-display text-[30px] font-medium leading-[1.25] text-text-primary">Meet, explain, decide, and keep the record in one room.</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-primary px-5 text-[14px] font-medium text-white" to="/chat">
              One-to-one chat
            </Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-default bg-white px-5 text-[14px] font-medium text-text-secondary hover:border-brand-primary hover:text-brand-primary" to="/rooms/new">
              Professional rooms
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              { icon: Video, title: 'Room meetings', text: 'Start focused team calls from a professional room.' },
              { icon: PenLine, title: 'Shared whiteboard', text: 'Draw flows, diagrams, and handoff notes together.' },
              { icon: ShieldCheck, title: 'Admin control', text: 'Creator approvals, room caps, and business-ready limits.' },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div className="rounded-xl border border-border-default bg-bg-secondary p-4" key={feature.title}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-subtle text-brand-primary"><Icon size={18} strokeWidth={1.7} /></span>
                  <p className="mt-3 text-[15px] font-medium text-text-primary">{feature.title}</p>
                  <p className="mt-1 text-[13px] leading-[1.55] text-text-secondary">{feature.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="rounded-xl border border-border-default bg-white p-4">
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-text-secondary">Meeting console</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-3 text-[13px] font-medium text-white"><Video size={16} /> Start</button>
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-default px-3 text-[13px] font-medium text-text-secondary"><MonitorUp size={16} /> Share</button>
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-default px-3 text-[13px] font-medium text-text-secondary"><Users size={16} /> Invite</button>
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-default px-3 text-[13px] font-medium text-text-secondary" onClick={downloadBoard}><Download size={16} /> Export</button>
              </div>
              <p className="mt-4 text-[13px] leading-[1.6] text-text-secondary">This panel is prepared for WebRTC meeting and room approval workflows while keeping personal chats lightweight.</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-border-default bg-white">
              <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
                <p className="text-[13px] font-medium text-text-primary">Collaborative whiteboard</p>
                <button className="rounded-full border border-border-default px-3 py-1.5 text-[12px] text-text-secondary" onClick={() => {
                  const canvas = canvasRef.current;
                  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                }} type="button">Clear</button>
              </div>
              <canvas
                className="h-[360px] w-full cursor-crosshair bg-[#fbfdfb]"
                height="720"
                onMouseDown={startDraw}
                onMouseLeave={() => setDrawing(false)}
                onMouseMove={draw}
                onMouseUp={() => setDrawing(false)}
                ref={canvasRef}
                width="1200"
              />
            </div>
          </div>
        </section>

        <aside className="rounded-xl border border-border-default bg-bg-primary p-5 shadow-card">
          <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-text-secondary">Pricing</p>
          <div className="mt-4 space-y-3">
            {plans.map((plan) => (
              <div className="rounded-xl border border-border-default bg-white p-4" key={plan.name}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-medium text-text-primary">{plan.name}</p>
                    <p className="mt-1 text-[12px] text-text-secondary">{plan.limit}</p>
                  </div>
                  <span className="rounded-full bg-brand-subtle px-3 py-1 text-[12px] font-medium text-brand-primary">{plan.price}</span>
                </div>
                <p className="mt-3 text-[13px] leading-[1.55] text-text-secondary">{plan.details}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
