import FormContainer from '@/app/components/forms/FormContainer'
import SignInForm from './SignInForm'

const SignIn = () => {
    return (
        <FormContainer
            title="Welcome Back"
            footerText="Don't have an account?"
            footerLinkText="Sign up"
            footerHref="/sign-up"
        >
            <SignInForm />
            <div className="flex justify-end mt-3">
                <a href="/reset-password" className=" text-gold hover:text-cream font-bold duration-300">
                    Forgot password?
                </a>
            </div>
        </FormContainer>
    )
}

export default SignIn