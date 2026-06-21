import { Map, ShieldAlert, Cpu, Database, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function HomeView({ setActiveView }) {
  const cards = [
    {
      id: 'command',
      title: 'Command Center',
      desc: 'Live traffic monitoring and network status.',
      icon: Map,
      color: 'var(--cyan)',
      gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.02) 100%)'
    },
    {
      id: 'deployments',
      title: 'Active Deployments',
      desc: 'Resource allocation and active officer deployments.',
      icon: ShieldAlert,
      color: 'var(--amber)',
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.02) 100%)'
    },
    {
      id: 'explain',
      title: 'AI Explanation Console',
      desc: 'Deep-dive hotspot diagnosis and reasoning.',
      icon: Cpu,
      color: 'var(--pink, #f472b6)',
      gradient: 'linear-gradient(135deg, rgba(244, 114, 182, 0.15) 0%, rgba(244, 114, 182, 0.02) 100%)'
    },
    {
      id: 'evidence',
      title: 'AI Trust Console',
      desc: 'Model validation, architecture, and system health.',
      icon: Database,
      color: 'var(--green)',
      gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.02) 100%)'
    }
  ];

  return (
    <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '64px', maxWidth: '600px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text)', marginBottom: '16px', letterSpacing: '-0.02em' }}>Welcome to Gridlock</h2>
        <p style={{ fontSize: '16px', color: 'var(--muted)', lineHeight: 1.6 }}>
          Your central intelligence hub for city-wide traffic management. Select a module below to monitor live conditions or analyze AI deployment recommendations.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', width: '100%', maxWidth: '900px' }}>
        {cards.map((card) => (
          <CardComponent key={card.id} card={card} setActiveView={setActiveView} />
        ))}
      </div>
    </div>
  );
}

function CardComponent({ card, setActiveView }) {
  const [hovered, setHovered] = useState(false);
  const IconComp = card.icon;

  return (
    <button
      type="button"
      onClick={() => setActiveView(card.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '32px',
        background: hovered ? card.gradient : 'var(--panel)',
        border: `1px solid ${hovered ? card.color : 'var(--line)'}`,
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? `0 12px 32px ${card.color}15` : 'none'
      }}
    >
      <div style={{ 
        background: hovered ? card.color : 'rgba(255,255,255,0.03)', 
        border: `1px solid ${hovered ? 'transparent' : 'var(--line)'}`, 
        padding: '16px', 
        borderRadius: '12px', 
        marginBottom: '24px', 
        transition: 'all 0.3s ease',
        zIndex: 1
      }}>
        <IconComp size={32} style={{ color: hovered ? '#fff' : card.color, transition: 'color 0.3s ease' }} />
      </div>
      <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', zIndex: 1 }}>
        {card.title}
        <ChevronRight size={20} style={{ color: card.color, opacity: hovered ? 1 : 0, transform: hovered ? 'translateX(0)' : 'translateX(-10px)', transition: 'all 0.3s ease' }} />
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0, lineHeight: 1.6, zIndex: 1 }}>{card.desc}</p>
      
      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '200px',
        height: '200px',
        background: `radial-gradient(circle, ${card.color}20 0%, transparent 70%)`,
        filter: 'blur(30px)',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: 'none',
        zIndex: 0
      }} />
    </button>
  );
}
