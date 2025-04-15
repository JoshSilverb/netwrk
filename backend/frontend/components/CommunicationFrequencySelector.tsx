import React from 'react'
import { Check, ChevronDown, ChevronUp } from '@tamagui/lucide-icons'

import type { FontSizeTokens, SelectProps } from 'tamagui'
import { Text, Input, Adapt, Label, Select, Sheet, XStack, YStack, getFontSize } from 'tamagui'
import { LinearGradient } from 'tamagui/linear-gradient'
import { useEffect, useState } from 'react'

type FrequencyOption = 'weeks' | 'months' 

type SelectDemoItemProps = SelectProps & {
    items: string[]
    onChange?: (weeks: number, months: number) => void
}

export function CommunicationFrequencySelector({ items, onChange, ...props }: SelectDemoItemProps) {
    const [selectedOption, setSelectedOption] = useState<FrequencyOption>('months')
    const [value, setValue] = useState('1')

    const [weeks,  setWeeks] = useState(0);
    const [months, setMonths] = useState(0);
    
    const cleanAndSetValue = (inputValue:string) => {
        const sanitizedValue = inputValue.replace(/[^0-9]/g, ''); // Remove non-numeric characters
        setValue(sanitizedValue);
    };

    useEffect(() => {
        const intValue = parseInt(value) || 0;

        // Set selected option's value and reset other one
        if (selectedOption === 'weeks') {
            setWeeks(intValue);
            setMonths(0);
            onChange?.(intValue, 0); // notify parent
        }
        else if (selectedOption === 'months') {
            setWeeks(0);
            setMonths(intValue);
            onChange?.(0, intValue); // notify parent
        }
    }, [selectedOption, value]);

    return (
        <XStack>
        <Input
            keyboardType="numeric"
            placeholder="value"
            width={60}
            value={value}
            onChangeText={cleanAndSetValue}
        />
        
        <Select value={selectedOption} onValueChange={setSelectedOption} disablePreventBodyScroll {...props}>
        <Select.Trigger width={220} iconAfter={ChevronDown}>
            <Select.Value placeholder="Something" />
        </Select.Trigger>

        <Adapt when="sm" platform="touch">
            <Sheet native={true} modal dismissOnSnapToBottom animation="medium">
            <Sheet.Frame>
                <Sheet.ScrollView>
                <Adapt.Contents />
                </Sheet.ScrollView>
            </Sheet.Frame>
            <Sheet.Overlay
                backgroundColor="$shadowColor"
                animation="lazy"
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
            />
            </Sheet>
        </Adapt>

        <Select.Content zIndex={200000}>
            <Select.ScrollUpButton
            alignItems="center"
            justifyContent="center"
            position="relative"
            width="100%"
            height="$3"
            >
            <YStack zIndex={10}>
                <ChevronUp size={20} />
            </YStack>
            <LinearGradient
                start={[0, 0]}
                end={[0, 1]}
                fullscreen
                colors={['$background', 'transparent']}
                borderRadius="$4"
            />
            </Select.ScrollUpButton>

            <Select.Viewport
            // to do animations:
            // animation="quick"
            // animateOnly={['transform', 'opacity']}
            // enterStyle={{ o: 0, y: -10 }}
            // exitStyle={{ o: 0, y: 10 }}
            minWidth={200}
            >
            <Select.Group>
                <Select.Label>Contact frequency</Select.Label>
                {/* for longer lists memoizing these is useful */}
                {React.useMemo(
                () =>
                    (['weeks', 'months'] as FrequencyOption[]).map((item, i) => {
                    return (
                        <Select.Item
                        index={i}
                        key={item}
                        value={item.toLowerCase()}
                        >
                        <Select.ItemText>{item}</Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto">
                            <Check size={16} />
                        </Select.ItemIndicator>
                        </Select.Item>
                    )
                    }),
                [items]
                )}
            </Select.Group>
            {/* Native gets an extra icon */}
            
                <YStack
                position="absolute"
                right={0}
                top={0}
                bottom={0}
                alignItems="center"
                justifyContent="center"
                width={'$4'}
                pointerEvents="none"
                >
                <ChevronDown
                    size={getFontSize((props.size as FontSizeTokens) ?? '$true')}
                />
                </YStack>
            
            </Select.Viewport>

            <Select.ScrollDownButton
            alignItems="center"
            justifyContent="center"
            position="relative"
            width="100%"
            height="$3"
            >
            <YStack zIndex={10}>
                <ChevronDown size={20} />
            </YStack>
            <LinearGradient
                start={[0, 0]}
                end={[0, 1]}
                fullscreen
                colors={['transparent', '$background']}
                borderRadius="$4"
            />
            </Select.ScrollDownButton>
        </Select.Content>
        </Select>

        </XStack>

    )
}
