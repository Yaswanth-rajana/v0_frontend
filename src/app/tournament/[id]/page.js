import { TournamentScreen } from "@/screen/tournament";
import { notFound } from "next/navigation";

const TournamentPage = async ({ params }) => {
  const { id } = await params;
  
  if (!id || id.startsWith('connector-')) {
    notFound();
  }

  return (
    <div>
      <TournamentScreen id={id} />
    </div>
  );
};

export default TournamentPage;
