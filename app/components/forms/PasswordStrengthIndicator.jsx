'use client'
import { getStrengthText } from '@/app/helpers/validatePwd'

const PasswordStrengthIndicator = ({ strength, password }) => {
    if (!password || !strength) return null

    return (
        <div className="mt-2">
            <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${strength.color === 'red' ? 'text-red-600' :
                    strength.color === 'yellow' ? 'text-yellow-600' :
                        'text-green-600'
                    }`}>
                    {getStrengthText(strength.score)}
                </span>
            </div>
            <ul className="mt-1 text-xs text-chino/80 space-y-1">
                {Array.isArray(strength.feedback) ?
                    strength.feedback.map((item, index) => (
                        <li key={index} className="flex items-center">
                            <span className="mr-2">•</span>
                            {item}
                        </li>
                    )) :
                    <li className="flex items-center">
                        <span className="mr-2">•</span>
                        {strength.feedback}
                    </li>
                }
            </ul>
        </div>
    )
}

export default PasswordStrengthIndicator
