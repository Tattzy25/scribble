import copy from "copy-to-clipboard";
import { Copy as CopyIcon, PlusCircle as PlusCircleIcon, Download as DownloadIcon, Share2 as ShareIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import Loader from "components/loader";

export default function Predictions({ predictions, submissionCount }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (submissionCount > 0) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [predictions, submissionCount]);

  if (submissionCount === 0) return;

  return (
    <section className="w-full my-10">
      <h2 className="text-center text-3xl font-bold m-6">Results</h2>

      {submissionCount > Object.keys(predictions).length && (
        <div className="pb-10 mx-auto w-full text-center">
          <div className="pt-10" ref={scrollRef} />
          <Loader />
        </div>
      )}

      {Object.values(predictions)
        .slice()
        .reverse()
        .map((prediction, index) => (
          <Fragment key={prediction.id}>
            {index === 0 &&
              submissionCount == Object.keys(predictions).length && (
                <div ref={scrollRef} />
              )}
            <Prediction prediction={prediction} />
          </Fragment>
        ))}
    </section>
  );
}

export function Prediction({ prediction, showLinkToNewScribble = false }) {
  const [linkCopied, setLinkCopied] = useState(false);

  const copyLink = () => {
    const url =
      window.location.origin +
      "/scribbles/" +
      (prediction.uuid || prediction.id); // if the prediction is from the Replicate API it'll have `id`. If it's from the SQL database, it'll have `uuid`
    copy(url);
    setLinkCopied(true);
  };

  const downloadImage = async () => {
    if (!prediction.output?.length) return;
    
    const imageUrl = prediction.output[prediction.output.length - 1];
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `scribble-${prediction.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Download failed
    }
  };

  const shareImage = async () => {
    if (!prediction.output?.length) return;
    
    const imageUrl = prediction.output[prediction.output.length - 1];
    const shareUrl = window.location.origin + "/scribbles/" + (prediction.uuid || prediction.id);
    
    if (navigator.share) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "scribble.png", { type: "image/png" });
        
        await navigator.share({
          title: "Scribble Diffusion",
          text: `Check out my AI-generated image: "${prediction.input.prompt}"`,
          url: shareUrl,
          files: [file],
        });
      } catch (error) {
        try {
          await navigator.share({
            title: "Scribble Diffusion",
            text: `Check out my AI-generated image: "${prediction.input.prompt}"`,
            url: shareUrl,
          });
        } catch (shareError) {
          // Share failed
        }
      }
    } else {
      copy(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  // Clear the "Copied!" message after 4 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setLinkCopied(false);
    }, 4 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (!prediction) return null;

  return (
    <div className="mt-6 mb-12">
      <div className="shadow-lg border my-5 p-5 bg-white flex">
        <div className="w-1/2 aspect-square relative border">
          <img
            src={prediction.input.image}
            alt="input scribble"
            className="w-full aspect-square"
          />
        </div>
        <div className="w-1/2 aspect-square relative">
          {prediction.output?.length ? (
            <img
              src={prediction.output[prediction.output.length - 1]}
              alt="output image"
              className="w-full aspect-square"
            />
          ) : (
            <div className="grid h-full place-items-center">
              <Loader />
            </div>
          )}
        </div>
      </div>
      <div className="text-center px-4 opacity-60 text-xl">
        &ldquo;{prediction.input.prompt}&rdquo;
      </div>
      <div className="text-center py-2">
        {prediction.output?.length && (
          <>
            <button className="lil-button" onClick={downloadImage}>
              <DownloadIcon className="icon" />
              Download
            </button>
            <button className="lil-button" onClick={shareImage}>
              <ShareIcon className="icon" />
              Share
            </button>
          </>
        )}

        {showLinkToNewScribble && (
          <Link href="/">
            <button className="lil-button" onClick={copyLink}>
              <PlusCircleIcon className="icon" />
              Create a new scribble
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
