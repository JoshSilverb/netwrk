import { useState, useEffect } from 'react';
import { View } from '@/components/Themed';
import  ContactsList from '@/components/ContactsList'
import { ScrollView, YStack, Paragraph, Input, Button, XStack, Sheet, Switch, Label, Text } from 'tamagui';
import { Loader } from '@/components/Loader';
import { searchContactsURL } from '@/constants/Apis';
import { useAuth } from '@/components/AuthContext';
import { Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import axios from 'axios';

export default function contactsScreen() {
    const tags = ['Friends', 'Family', 'Work', 'Other']; // Example tag list
    const { token, setToken } = useAuth();

    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        console.log(`Search query: ${searchQuery}`);
        console.log(`Selected tags: ${selectedTags}`);

        // Search query to be sent
        const requestBody = {
            user_token: token,
            query_string: searchQuery,
            tags: selectedTags
        }

        try {
            const response = await axios.post(searchContactsURL, requestBody);
            setContacts(response.data);
            console.log(contacts);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    

    const toggleTag = (tag: string) => {
        setSelectedTags((prevTags) =>
            prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]
        );
    };
    
    return (
        <View className="flex-1 justify-start bg-white	">
            <ScrollView>

                {/* <Paragraph className="block mb-2 mx-2 text-base font-medium">
                    Sort by...
                </Paragraph> */}
                <YStack >
                    {/* Search Bar and Tag Selector */}
                    <XStack alignItems="center" space="$2" width="100%">
                    {/* Dropdown Menu */}
                    <Button
                        size="$3"
                        onPress={() => setDropdownOpen(true)}
                        iconAfter={<Ionicons name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} />}
                        width={120}
                    >
                        {selectedTags.length > 0 ? `Tags (${selectedTags.length})` : 'Select Tags'}
                    </Button>

                    {/* Search Bar */}
                    <XStack flex={1} alignItems="center" borderWidth={1} borderColor="$borderColor" borderRadius="$4">
                        <Input
                        flex={1}
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={() => {
                            Keyboard.dismiss();
                            fetchContacts();
                        }}
                        returnKeyType="search"
                        />
                        <Button
                        size="$2"
                        circular
                        icon={<Ionicons name="search" size={16} />}
                        onPress={fetchContacts}
                        />
                    </XStack>
                    </XStack>

                    {/* Tag Selection Modal */}
                    {dropdownOpen && (
                    <Sheet modal open={dropdownOpen} onOpenChange={setDropdownOpen} dismissOnOverlayPress>
                        <Sheet.Frame>
                        <Sheet.Handle />
                        <ScrollView>
                            <YStack space="$4" padding="$4">
                            <Text fontWeight="700" fontSize="$5">Select Tags</Text>
                            {tags.map((tag) => (
                                <XStack key={tag} alignItems="center" space="$2">
                                <Switch
                                    checked={selectedTags.includes(tag)}
                                    onCheckedChange={() => toggleTag(tag)}
                                />
                                <Label>{tag}</Label>
                                </XStack>
                            ))}
                            </YStack>
                        </ScrollView>
                        <XStack padding="$4" justifyContent="flex-end" space="$2">
                            <Button
                            size="$3"
                            theme="alt2"
                            onPress={() => setDropdownOpen(false)}
                            >
                            Cancel
                            </Button>
                            <Button
                            size="$3"
                            onPress={() => {
                                setDropdownOpen(false);
                                fetchContacts();
                            }}
                            >
                            Apply
                            </Button>
                        </XStack>
                        </Sheet.Frame>
                    </Sheet>
                    )}

                    <Loader loading={loading}>
                        <ContactsList contacts={contacts}/>
                    </Loader>
                </YStack>
            </ScrollView>
        </View>
    );

}
