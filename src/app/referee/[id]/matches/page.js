import { Matches } from "@/screen/referee/matches";

const RefereeMatchesPage = async ({ params }) => {
  const { id } = await params;
  return <Matches id={id} />;
};

export default RefereeMatchesPage;
