import { TournamentScreen } from "@/screen/tournament";

const TournamentPage = async ({ params }) => {
  const { id } = await params;
  
  return (
    <div>
      <TournamentScreen id={id} />
    </div>
  );
};

export default TournamentPage;
