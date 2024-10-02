import { useState, useEffect } from 'react';
import { Spinner } from 'tamagui';


export const Loader = ({ loading, size = "large", color = "$gray", children }) => {
    const [isExpired, setIsExpired] = useState(true);
  
    const delay = 1000; //1s
    let setTimeoutInstance;
    
    useEffect(() => {
        if (loading) {
            setIsExpired(false);
    
            if (setTimeoutInstance) {
                clearTimeout(setTimeoutInstance);
            }
            setTimeoutInstance = setTimeout(() => {
                setIsExpired(true);
            }, delay);
        }
    }, [loading]);
  
    if (!isExpired) {
        return (
            <Spinner size={size} color={color} />
        );
    }
  
    return children;
};
