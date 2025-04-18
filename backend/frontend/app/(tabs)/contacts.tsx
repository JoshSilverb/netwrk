import { useState, useEffect } from 'react';
import  ContactsList from '@/components/ContactsList'
import { RadioGroup, ScrollView, YStack, Paragraph, Input, Button, XStack, Sheet, Switch, Label, Text, View } from 'tamagui';
import { Loader } from '@/components/Loader';
import { searchContactsURL, getTagsForUserURL } from '@/constants/Apis';
import { useAuth } from '@/components/AuthContext';
import { Keyboard, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Months } from '@/constants/Definitions';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getCurrentLocation } from '@/utils/locationutil';

import axios from 'axios';

export default function contactsScreen() {
    // const tags = ['Friends', 'Family', 'Work', 'Other']; // Example tag list
    const sortOptions = [
        'Date added', 
        'Last contacted (newest)', 
        'Last contacted (oldest)', 
        'Alphabetical',
        'Distance',
        'Relevance',
        'Next contact date'];

    const { token, setToken } = useAuth();

    const [tags, setTags] = useState([]);

    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedSortOption, setSelectedSortOption] = useState(String(sortOptions[0]));

    const [dateLowerBound, setDateLowerBound] = useState(new Date(0));
    const [dateUpperBound, setDateUpperBound] = useState(new Date(Date.now()));

    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
    const [showDateLowerBound, setShowDateLowerBound] = useState(false);
    const [showDateUpperBound, setShowDateUpperBound] = useState(false);

    const showDateLowerBoundPicker = () => {
        setShowDateLowerBound(true);
    };
    const showDateUpperBoundPicker = () => {
        setShowDateUpperBound(true);
    };

    const onChangeDateLowerBound = (event, selectedDate) => {
        const currentDate = selectedDate;
        setShowDateLowerBound(false);
        setDateLowerBound(currentDate);
    };
    const onChangeDateUpperBound = (event, selectedDate) => {
        const currentDate = selectedDate;
        setShowDateUpperBound(false);
        setDateUpperBound(currentDate);
    };

    function isDateUnset(date: Date): boolean {
        const minDate = new Date(0);
        return String(date) === String(minDate);
    }

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchTags = async () => {

        // Get Tags query to be sent
        const requestBody = {
            user_token: token
        }

        console.log("Sending get tags request with body:", requestBody);

        try {
            setLoading(true);
            const response = await axios.post(getTagsForUserURL, requestBody);
            setTags(response.data);
            console.log(tags);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tags data:', error);
        }
    };

    const fetchContacts = async () => {
        const location = await getCurrentLocation();
        
        console.log(`Search query: ${searchQuery}`);
        console.log(`Selected tags: ${selectedTags}`);
        console.log(`Current location: ${location}`);

        // Search query to be sent
        const requestBody = {
            user_token: token,
            search_params: {
                query_string: searchQuery,
                order_by: selectedSortOption,
                tags: selectedTags,
                lower_bound_date: dateLowerBound,
                upper_bound_date: dateUpperBound,
                user_lat: location.latitude,
                user_lon: location.longitude,
            }
        }

        console.log("Sending search request with body:", requestBody);

        try {
            setLoading(true);
            const response = await axios.post(searchContactsURL, requestBody);
            setContacts(response.data);
            console.log(contacts);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchAll = async () => {
        fetchTags();
        fetchContacts();
    }

    const toggleTag = (tag: string) => {
        setSelectedTags((prevTags) =>
            prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]
        );
    };
    
    return (
        <View className="flex-1 justify-start bg-white">
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAll} />}>
                <YStack >
                    {/* Search Bar and Tag Selector */}
                    <XStack alignItems="center" space="$2" width="100%" paddingLeft="$2" paddingRight="$2">
                    {/* Dropdown Menu */}
                    <Button
                        size="$4"
                        onPress={() => setFilterDropdownOpen(true)}
                        iconAfter={<Ionicons name={filterDropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} />}
                        width={120}
                    >
                        Filter by...
                    </Button>

                    {/* Search Bar */}
                    <XStack flex={1} alignItems="center" borderWidth={1} borderColor="$borderColor" borderRadius="$4">
                        <Input
                        size="$4"
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
                    </XStack>
                    </XStack>

                    {/* Filter Selection Modal */}
                    {filterDropdownOpen && (
                    <Sheet modal open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen} dismissOnOverlayPress>
                        <Sheet.Frame>
                        <Sheet.Handle />
                        <ScrollView>
                            <YStack space="$4" padding="$4">
                            <Text fontWeight="700" fontSize="$5">Sort by:</Text>
                            {/* Sort by filter button */}
                            <Button
                                size="$4"
                                onPress={() => setSortDropdownOpen(true)}
                                iconAfter={<Ionicons name={sortDropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} />}
                            >
                                {selectedSortOption}
                            </Button>

                            <Text fontWeight="700" fontSize="$5">Filter by:</Text>
                            {/* Tags filter button */}
                            <Button
                                size="$4"
                                onPress={() => setTagsDropdownOpen(true)}
                                iconAfter={<Ionicons name={tagsDropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} />}
                            >
                                {selectedTags.length > 0 ? `Tags (${selectedTags.length})` : 'Select Tags'}
                            </Button>
                            {/* Last contact filter buttons */}
                            <XStack space="$4">
                            <YStack space="$2">
                                <Text fontSize="$3">Last contacted after</Text>
                                <View className="flex border mt-1 rounded-md border-slate-200 ">
                                    <Pressable onPress={showDateLowerBoundPicker} className="my-1">
                                        <Text className='pl-1'>{isDateUnset(dateLowerBound) ? 'No lower bound' : `${dateLowerBound.getDate()} ${Months[dateLowerBound.getMonth()]} ${dateLowerBound.getFullYear()}`}</Text>
                                        {showDateLowerBound && (
                                            <DateTimePicker
                                            className="p-1"
                                            testID="dateTimePicker"
                                            value={isDateUnset(dateLowerBound) ? dateUpperBound : dateLowerBound}
                                            mode="date"
                                            onChange={onChangeDateLowerBound}
                                            />
                                        )}
                                    </Pressable>
                                </View>
                                <Button 
                                    size="$2"
                                    onPress={() => setDateLowerBound(new Date(0))}
                                >
                                    Reset
                                </Button>
                            </YStack>
                            <YStack space="$2" >
                                <Text fontSize="$3">Last contacted before</Text>
                                <View className="flex border mt-1 rounded-md border-slate-200 ">
                                    <Pressable onPress={showDateUpperBoundPicker} className="my-1">
                                        <Text className='pl-1'>{dateUpperBound.getDate()} {Months[dateUpperBound.getMonth()]} {dateUpperBound.getFullYear()}</Text>
                                        {showDateUpperBound && (
                                            <DateTimePicker
                                            className="p-1"
                                            testID="dateTimePicker"
                                            value={dateUpperBound}
                                            mode="date"
                                            onChange={onChangeDateUpperBound}
                                            />
                                        )}
                                    </Pressable>
                                </View>
                                <Button 
                                    size="$2"
                                    onPress={() => setDateUpperBound(new Date(Date.now()))}
                                >
                                    Reset
                                </Button>
                            </YStack>
                            
                            </XStack>
                            </YStack>
                        </ScrollView>
                        <XStack padding="$4" justifyContent="flex-end" space="$2">
                            <Button
                            size="$3"
                            theme="alt2"
                            onPress={() => setFilterDropdownOpen(false)}
                            >
                            Cancel
                            </Button>
                            <Button
                            size="$3"
                            onPress={() => {
                                setFilterDropdownOpen(false);
                                fetchContacts();
                            }}
                            >
                            Apply
                            </Button>
                        </XStack>
                        </Sheet.Frame>
                    </Sheet>
                    )}

                    {/* Tag Selection Modal */}
                    {tagsDropdownOpen && (
                    <Sheet modal open={tagsDropdownOpen} onOpenChange={setTagsDropdownOpen} dismissOnOverlayPress>
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
                            onPress={() => setTagsDropdownOpen(false)}
                            >
                            Cancel
                            </Button>
                            <Button
                            size="$3"
                            onPress={() => {
                                setTagsDropdownOpen(false);
                            }}
                            >
                            Apply
                            </Button>
                        </XStack>
                        </Sheet.Frame>
                    </Sheet>
                    )}

                    {/* Sort Option Selection Modal */}
                    {sortDropdownOpen && (
                    <Sheet modal open={sortDropdownOpen} onOpenChange={setSortDropdownOpen} dismissOnOverlayPress>
                        <Sheet.Frame>
                        <Sheet.Handle />
                        <ScrollView>
                            <YStack space="$4" padding="$4">
                            <Text fontWeight="700" fontSize="$5">Sort by:</Text>
                            <RadioGroup 
                                defaultValue={selectedSortOption}
                                onValueChange={(value) => setSelectedSortOption(value)}
                            >
                            {sortOptions.map((sortOption, index) => (
                                <XStack width={300} alignItems="center" space="$4" key={`sortoptions-${index}`}>
                                <RadioGroup.Item value={`${sortOption}`} id={`radiogroup-${index}`}>
                                  <RadioGroup.Indicator />
                                </RadioGroup.Item>
                          
                                <Label htmlFor={`radiogroup-${index}`}>
                                  {sortOption}
                                </Label>
                              </XStack>
                            ))}

                            </RadioGroup>
                            </YStack>
                        </ScrollView>
                        <XStack padding="$4" justifyContent="flex-end" space="$2">
                            <Button
                            size="$3"
                            theme="alt2"
                            onPress={() => setSortDropdownOpen(false)}
                            >
                            Cancel
                            </Button>
                            <Button
                            size="$3"
                            onPress={() => {
                                setSortDropdownOpen(false);
                            }}
                            >
                            Apply
                            </Button>
                        </XStack>
                        </Sheet.Frame>
                    </Sheet>
                    )}

                    <Loader loading={loading}>
                        <ContactsList contacts={contacts} prefix="searchlist"/>
                    </Loader>
                </YStack>
            </ScrollView>
        </View>
    );

}
