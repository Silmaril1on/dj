import Spinner from "@/app/components/ui/Spinner";

const loading = () => {
  return (
    <div className="center h-screen">
      <Spinner type="logo" />
    </div>
  );
};

export default loading;
