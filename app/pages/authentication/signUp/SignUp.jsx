import FormContainer from "@/app/components/forms/FormContainer";
import RegisterForm from "./RegisterForm";

const SignUp = () => {
  return (
    <FormContainer
      title="Create Your Account"
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerHref="/sign-in"
      className="w-full lg:w-md"
    >
      <RegisterForm />
    </FormContainer>
  );
};

export default SignUp;
