import React, { useEffect, useState } from 'react'
import { ChevronDown } from '@tamagui/lucide-icons'
import type { SelectProps } from 'tamagui'
import { Input, Accordion, Square, XStack, Paragraph } from 'tamagui'
import { BORDER_RADIUS } from '@/constants/Styles';

type FrequencyOption = 'weeks' | 'months'

type SelectDemoItemProps = SelectProps & {
    onChange?: (weeks: number, months: number) => void
}

export function CommunicationFrequencySelector({ onChange, ...props }: SelectDemoItemProps) {
    const [selectedOption, setSelectedOption] = useState<FrequencyOption>('months')
    const [value, setValue] = useState('1')

    const cleanAndSetValue = (inputValue: string) => {
        const sanitizedValue = inputValue.replace(/[^0-9]/g, '')
        setValue(sanitizedValue)
    }

    const handleOptionSelect = (option: FrequencyOption) => {
        setSelectedOption(option)
    }

    useEffect(() => {
        const intValue = parseInt(value) || 0

        if (selectedOption === 'weeks') {
            onChange?.(intValue, 0)
        } else if (selectedOption === 'months') {
            onChange?.(0, intValue)
        }
    }, [selectedOption, value, onChange])

    return (
        <XStack gap="$2" alignItems="flex-start" width="100%">
            <Input
                keyboardType="numeric"
                placeholder="1"
                width={60}
                height={44}
                value={value}
                onChangeText={cleanAndSetValue}
            />

            <Accordion overflow="hidden" flex={1} type="multiple" borderRadius={BORDER_RADIUS.sm}>
                <Accordion.Item value="frequency">
                    <Accordion.Trigger flexDirection="row" justifyContent="space-between" height={44} paddingVertical="$2">
                        {({ open }: { open: boolean }) => (
                            <>
                                <Paragraph>{selectedOption}</Paragraph>
                                <Square animation="quick" rotate={open ? '180deg' : '0deg'}>
                                    <ChevronDown size="$1" />
                                </Square>
                            </>
                        )}
                    </Accordion.Trigger>
                    <Accordion.Content>
                        <XStack flexDirection="column" gap="$2">
                            <Paragraph
                                onPress={() => handleOptionSelect('weeks')}
                                padding="$2"
                                backgroundColor={selectedOption === 'weeks' ? '$blue4' : 'transparent'}
                                cursor="pointer"
                            >
                                weeks
                            </Paragraph>
                            <Paragraph
                                onPress={() => handleOptionSelect('months')}
                                padding="$2"
                                backgroundColor={selectedOption === 'months' ? '$blue4' : 'transparent'}
                                cursor="pointer"
                            >
                                months
                            </Paragraph>
                        </XStack>
                    </Accordion.Content>
                </Accordion.Item>
            </Accordion>
        </XStack>
    )
}
