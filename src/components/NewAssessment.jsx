export default function NewAssessment() {
  return (
    <div className="w-full h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] bg-white rounded-2xl border border-brand-border shadow-premium overflow-hidden">
      <iframe
        src="https://cricketspoolandspaworld.fillout.com/t/9mRHaghzJxus"
        width="100%"
        height="100%"
        frameBorder="0"
        title="New Assessment Form"
        className="w-full h-full border-none"
        allow="geolocation; microphone; camera"
      ></iframe>
    </div>
  );
}
