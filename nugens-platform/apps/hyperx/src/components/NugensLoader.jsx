import genEImage from "../assets/gen-e-ai.png";

export default function NugensLoader({ label = "Loading Nugens..." }) {
  return (
    <div className="nugens-loader" role="status" aria-live="polite" aria-label={label}>
      <style>{`
        .nugens-loader {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 50% 42%, rgba(56, 189, 248, 0.18), transparent 32%),
            linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow: hidden;
        }
        .nugens-loader__stage {
          position: relative;
          width: min(260px, 70vw);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
        }
        .nugens-loader__ring {
          position: absolute;
          inset: 15%;
          border-radius: 999px;
          border: 2px solid rgba(14, 165, 233, 0.34);
          box-shadow: 0 0 34px rgba(14, 165, 233, 0.24);
          animation: nugens-ring 1.8s ease-in-out infinite;
        }
        .nugens-loader__image {
          width: 82%;
          height: 82%;
          object-fit: cover;
          border-radius: 28px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
          animation: nugens-float 2.4s ease-in-out infinite;
        }
        .nugens-loader__text {
          position: absolute;
          bottom: -22px;
          color: #0f172a;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0;
        }
        @keyframes nugens-float {
          0%, 100% { transform: translateY(0) scale(1); filter: saturate(1); }
          50% { transform: translateY(-10px) scale(1.025); filter: saturate(1.12); }
        }
        @keyframes nugens-ring {
          0%, 100% { transform: scale(0.86); opacity: 0.42; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
      <div className="nugens-loader__stage">
        <div className="nugens-loader__ring" />
        <img className="nugens-loader__image" src={genEImage} alt="" />
        <div className="nugens-loader__text">{label}</div>
      </div>
    </div>
  );
}
