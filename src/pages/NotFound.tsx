import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
      <div className="relative select-none">
        <h1
          className="text-[10rem] bg-lin font-extrabold font-mono leading-none text-transparent"
          style={{
            WebkitTextStroke: "2px",
            WebkitTextStrokeColor: "transparent",
            backgroundImage: "linear-gradient(135deg, #a855f7, #4f46e5)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            filter:
              "drop-shadow(2px 2px 0px #ff0050) drop-shadow(-2px -2px 0px #0050ff)",
          }}
        >
          404
        </h1>
        <p
          className="text-white font-extrabold font-mono tracking-[0.3em] text-2xl text-center uppercase"
          style={{ textShadow: "1px 1px 0 #ff0050, -1px -1px 0 #0050ff" }}
        >
          Page Not Found
        </p>
      </div>
      <Link
        to="/"
        className="mt-2 px-8 py-1.5 border border-red-600 text-red-500 font-mono font-bold tracking-widest text-xs uppercase hover:bg-red-600 hover:text-white transition-colors"
      >
        Homepage
      </Link>
    </div>
  );
};

export default NotFound;
