import React, { useEffect, useState } from 'react'
import { ChevronDown } from '@tamagui/lucide-icons'
import type { SelectProps } from 'tamagui'
import { Input, Accordion, Square, XStack, Paragraph, Separator } from 'tamagui'
import { BORDER_RADIUS } from '@/constants/Styles';

const TEAL = '#14B8A6';

type FrequencyOption = 'weeks' | 'months'

type SelectDemoItemProps = SelectProps & {
    onChange?: (weeks: number, months: number) => void,
    initialFrequencyType?: FrequencyOption,
    initialValue?: number
}

export function CommunicationFrequencySelector({ onChange, initialFrequencyType, initialValue, ...props }: SelectDemoItemProps) {
    const [selectedOption, setSelectedOption] = useState<FrequencyOption>(initialFrequencyType || 'months')
    const [value, setValue] = useState(String(initialValue || 1))
    const [openItems, setOpenItems] = useState<string[]>([])

    console.log(`Initialized selector with freq: ${selectedOption} given ${initialFrequencyType}`)

    // Sync state with prop changes
    useEffect(() => {
        if (initialFrequencyType && initialFrequencyType !== selectedOption) {
            console.log(`Updating selectedOption from ${selectedOption} to ${initialFrequencyType}`)
            setSelectedOption(initialFrequencyType)
        }
        if (initialValue && String(initialValue) !== value) {
            console.log(`Updating value from ${value} to ${initialValue}`)
            setValue(String(initialValue))
        }
    }, [initialFrequencyType, initialValue])

    const cleanAndSetValue = (inputValue: string) => {
        const sanitizedValue = inputValue.replace(/[^0-9]/g, '')
        setValue(sanitizedValue)
    }

    const handleOptionSelect = (option: FrequencyOption) => {
        setSelectedOption(option)
        setOpenItems([])
    }

    useEffect(() => {
        const intValue = parseInt(value) || 0

        console.log(`Update to communication frequency: now it's ${selectedOption}, ${intValue}`)

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
                backgroundColor="$background"
            />

            <Accordion overflow="hidden" flex={1} type="multiple" borderRadius={BORDER_RADIUS.sm} backgroundColor="$background" borderWidth={1} borderColor="$borderColor" value={openItems} onValueChange={setOpenItems}>
                <Accordion.Item value="frequency">
                    <Accordion.Trigger flexDirection="row" justifyContent="space-between" height={44} paddingVertical="$2" backgroundColor="transparent">
                        {({ open }: { open: boolean }) => (
                            <>
                                <Paragraph>{selectedOption}</Paragraph>
                                <Square animation="quick" rotate={open ? '180deg' : '0deg'}>
                                    <ChevronDown size="$1" />
                                </Square>
                            </>
                        )}
                    </Accordion.Trigger>
                    <Accordion.Content padding={0} borderTopWidth={1} borderTopColor="$borderColor" >
                        <XStack flexDirection="column">
                            <Paragraph
                                onPress={() => handleOptionSelect('weeks')}
                                paddingHorizontal="$3"
                                paddingVertical="$2"
                                backgroundColor={selectedOption === 'weeks' ? 'rgba(20,184,166,0.1)' : 'transparent'}
                                color={selectedOption === 'weeks' ? TEAL : '$color'}
                                fontWeight={selectedOption === 'weeks' ? '600' : '400'}
                                cursor="pointer"
                            >
                                weeks
                            </Paragraph>
                            <Separator />
                            <Paragraph
                                onPress={() => handleOptionSelect('months')}
                                paddingHorizontal="$3"
                                paddingVertical="$2"
                                backgroundColor={selectedOption === 'months' ? 'rgba(20,184,166,0.1)' : 'transparent'}
                                color={selectedOption === 'months' ? TEAL : '$color'}
                                fontWeight={selectedOption === 'months' ? '600' : '400'}
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
