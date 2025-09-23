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
        </FormContainer>
    )
}

export default SignIn