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
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES, BORDER_RADIUS } from '@/constants/Styles';

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
        <View style={CONTAINER_STYLES.screen}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAll} />}>
                <YStack>
                    {/* Search Bar and Tag Selector */}
                    <XStack 
                        alignItems="center" 
                        space={SPACING.sm} 
                        width="100%" 
                        padding={SPACING.md}
                    >
                    {/* Dropdown Menu */}
                    <Button
                        size="$3"
                        onPress={() => setFilterDropdownOpen(true)}
                        iconAfter={<Ionicons name={filterDropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} />}
                        variant="outlined"
                        width={120}
                        fontSize={TYPOGRAPHY.sizes.sm}
                    >
                        Filter by...
                    </Button>

                    {/* Search Bar */}
                    <XStack 
                        flex={1} 
                        alignItems="center" 
                        borderWidth={1} 
                        borderColor="$borderColor" 
                        borderRadius={BORDER_RADIUS.md}
                        backgroundColor="$background"
                    >
                        <Input
                        size="$3"
                        flex={1}
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={() => {
                            Keyboard.dismiss();
                            fetchContacts();
                        }}
                        returnKeyType="search"
                        borderWidth={0}
                        backgroundColor="transparent"
                        />
                    </XStack>
                    </XStack>

                    {/* Filter Selection Modal */}
                    {filterDropdownOpen && (
                    <Sheet modal open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen} dismissOnOverlayPress>
                        <Sheet.Frame 
                            backgroundColor="$background"
                            borderTopLeftRadius={BORDER_RADIUS.lg}
                            borderTopRightRadius={BORDER_RADIUS.lg}
                        >
                        <Sheet.Handle backgroundColor="$gray8" />
                        <ScrollView>
                            <YStack 
                                space={SPACING.lg} 
                                padding={SPACING.lg}
                            >
                            {/* Sort by section */}
                            <YStack 
                                space={SPACING.sm}
                                padding={SPACING.md}
                                borderWidth={1}
                                borderColor="$borderColor"
                                borderRadius={BORDER_RADIUS.md}
                                backgroundColor="$gray1"
                            >
                                <Text 
                                    fontSize={TYPOGRAPHY.sizes.md}
                                    fontWeight={TYPOGRAPHY.weights.medium}
                                    color="$gray11"
                                    marginBottom={SPACING.xs}
                                >
                                    Sort by
                                </Text>
                                <Button
                                    size="$3"
                                    onPress={() => setSortDropdownOpen(true)}
                                    iconAfter={<Ionicons name={sortDropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} />}
                                    variant="outlined"
                                    backgroundColor="$background"
                                    borderColor="$borderColor"
                                    borderRadius={BORDER_RADIUS.md}
                                    justifyContent="space-between"
                                >
                                    {selectedSortOption}
                                </Button>
                            </YStack>

                            {/* Filter by tags section */}
                            <YStack 
                                space={SPACING.sm}
                                padding={SPACING.md}
                                borderWidth={1}
                                borderColor="$borderColor"
                                borderRadius={BORDER_RADIUS.md}
                                backgroundColor="$gray1"
                            >
                                <Text 
                                    fontSize={TYPOGRAPHY.sizes.md}
                                    fontWeight={TYPOGRAPHY.weights.medium}
                                    color="$gray11"
                                    marginBottom={SPACING.xs}
                                >
                                    Filter by tags
                                </Text>
                                <Button
                                    size="$3"
                                    onPress={() => setTagsDropdownOpen(true)}
                                    iconAfter={<Ionicons name={tagsDropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} />}
                                    variant="outlined"
                                    backgroundColor="$background"
                                    borderColor="$borderColor"
                                    borderRadius={BORDER_RADIUS.md}
                                    justifyContent="space-between"
                                >
                                    {selectedTags.length > 0 ? `Tags (${selectedTags.length})` : 'Select Tags'}
                                </Button>
                            </YStack>

                            {/* Date range section */}
                            <YStack 
                                space={SPACING.md}
                                padding={SPACING.md}
                                borderWidth={1}
                                borderColor="$borderColor"
                                borderRadius={BORDER_RADIUS.md}
                                backgroundColor="$gray1"
                            >
                                <Text 
                                    fontSize={TYPOGRAPHY.sizes.md}
                                    fontWeight={TYPOGRAPHY.weights.medium}
                                    color="$gray11"
                                    marginBottom={SPACING.xs}
                                >
                                    Last contact date range
                                </Text>
                                <XStack space={SPACING.md}>
                                <YStack space={SPACING.xs} flex={1}>
                                    <Text 
                                        fontSize={TYPOGRAPHY.sizes.sm}
                                        fontWeight={TYPOGRAPHY.weights.medium}
                                        color="$gray10"
                                    >
                                        After
                                    </Text>
                                    <Pressable onPress={showDateLowerBoundPicker}>
                                        <View
                                            padding={SPACING.sm}
                                            borderWidth={1}
                                            borderColor="$borderColor"
                                            borderRadius={BORDER_RADIUS.sm}
                                            backgroundColor="$background"
                                            minHeight={44}
                                            justifyContent="center"
                                        >
                                            <Text 
                                                fontSize={TYPOGRAPHY.sizes.sm}
                                                textAlign="center"
                                                color={isDateUnset(dateLowerBound) ? "$gray9" : "$color"}
                                            >
                                                {isDateUnset(dateLowerBound) ? 'No lower bound' : `${dateLowerBound.getDate()} ${Months[dateLowerBound.getMonth()]} ${dateLowerBound.getFullYear()}`}
                                            </Text>
                                            {showDateLowerBound && (
                                                <DateTimePicker
                                                testID="dateTimePicker"
                                                value={isDateUnset(dateLowerBound) ? dateUpperBound : dateLowerBound}
                                                mode="date"
                                                onChange={onChangeDateLowerBound}
                                                />
                                            )}
                                        </View>
                                    </Pressable>
                                    <Button 
                                        size="$2"
                                        variant="outlined"
                                        disabled={isDateUnset(dateLowerBound)}
                                        onPress={() => setDateLowerBound(new Date(0))}
                                        fontSize={TYPOGRAPHY.sizes.xs}
                                    >
                                        Reset
                                    </Button>
                                </YStack>
                                <YStack space={SPACING.xs} flex={1}>
                                    <Text 
                                        fontSize={TYPOGRAPHY.sizes.sm}
                                        fontWeight={TYPOGRAPHY.weights.medium}
                                        color="$gray10"
                                    >
                                        Before
                                    </Text>
                                    <Pressable onPress={showDateUpperBoundPicker}>
                                        <View
                                            padding={SPACING.sm}
                                            borderWidth={1}
                                            borderColor="$borderColor"
                                            borderRadius={BORDER_RADIUS.sm}
                                            backgroundColor="$background"
                                            minHeight={44}
                                            justifyContent="center"
                                        >
                                            <Text 
                                                fontSize={TYPOGRAPHY.sizes.sm}
                                                textAlign="center"
                                            >
                                                {dateUpperBound.getDate()} {Months[dateUpperBound.getMonth()]} {dateUpperBound.getFullYear()}
                                            </Text>
                                            {showDateUpperBound && (
                                                <DateTimePicker
                                                testID="dateTimePicker"
                                                value={dateUpperBound}
                                                mode="date"
                                                onChange={onChangeDateUpperBound}
                                                />
                                            )}
                                        </View>
                                    </Pressable>
                                    <Button 
                                        size="$2"
                                        variant="outlined"
                                        disabled={isDateUnset(dateLowerBound)}
                                        onPress={() => setDateUpperBound(new Date(Date.now()))}
                                        fontSize={TYPOGRAPHY.sizes.xs}
                                    >
                                        Reset
                                    </Button>
                                </YStack>
                                </XStack>
                            </YStack>
                            </YStack>
                        </ScrollView>
                        <XStack 
                            padding={SPACING.md} 
                            justifyContent="flex-end" 
                            space={SPACING.sm}
                            borderTopWidth={1}
                            borderTopColor="$borderColor"
                            backgroundColor="$background"
                        >
                            <Button
                            size="$3"
                            variant="outlined"
                            onPress={() => setFilterDropdownOpen(false)}
                            borderRadius={BORDER_RADIUS.md}
                            >
                            Cancel
                            </Button>
                            <Button
                            size="$3"
                            onPress={() => {
                                setFilterDropdownOpen(false);
                                fetchContacts();
                            }}
                            backgroundColor="$blue9"
                            color="white"
                            borderRadius={BORDER_RADIUS.md}
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
                        <Sheet.Frame 
                            backgroundColor="$background"
                            borderTopLeftRadius={BORDER_RADIUS.lg}
                            borderTopRightRadius={BORDER_RADIUS.lg}
                        >
                        <Sheet.Handle backgroundColor="$gray8" />
                        <ScrollView>
                            <YStack 
                                space={SPACING.lg} 
                                padding={SPACING.lg}
                            >
                            <YStack 
                                space={SPACING.md}
                                padding={SPACING.md}
                                borderWidth={1}
                                borderColor="$borderColor"
                                borderRadius={BORDER_RADIUS.md}
                                backgroundColor="$gray1"
                            >
                                <Text 
                                    fontSize={TYPOGRAPHY.sizes.md}
                                    fontWeight={TYPOGRAPHY.weights.medium}
                                    color="$gray11"
                                    marginBottom={SPACING.xs}
                                >
                                    Select Tags
                                </Text>
                                {tags.map((tag) => (
                                    <XStack 
                                        key={tag} 
                                        alignItems="center" 
                                        space={SPACING.sm}
                                        padding={SPACING.xs}
                                        borderRadius={BORDER_RADIUS.sm}
                                        backgroundColor="$background"
                                        borderWidth={selectedTags.includes(tag) ? 1 : 0}
                                        borderColor={selectedTags.includes(tag) ? "$blue6" : "transparent"}
                                    >
                                    <Switch
                                        checked={selectedTags.includes(tag)}
                                        onCheckedChange={() => toggleTag(tag)}
                                        size="$2"
                                    />
                                    <Label 
                                        fontSize={TYPOGRAPHY.sizes.sm}
                                        color="$color"
                                        flex={1}
                                    >
                                        {tag}
                                    </Label>
                                    </XStack>
                                ))}
                            </YStack>
                            </YStack>
                        </ScrollView>
                        <XStack 
                            padding={SPACING.md} 
                            justifyContent="flex-end" 
                            space={SPACING.sm}
                            borderTopWidth={1}
                            borderTopColor="$borderColor"
                            backgroundColor="$background"
                        >
                            <Button
                            size="$3"
                            variant="outlined"
                            onPress={() => setTagsDropdownOpen(false)}
                            borderRadius={BORDER_RADIUS.md}
                            >
                            Cancel
                            </Button>
                            <Button
                            size="$3"
                            onPress={() => {
                                setTagsDropdownOpen(false);
                            }}
                            backgroundColor="$blue9"
                            color="white"
                            borderRadius={BORDER_RADIUS.md}
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
                        <Sheet.Frame 
                            backgroundColor="$background"
                            borderTopLeftRadius={BORDER_RADIUS.lg}
                            borderTopRightRadius={BORDER_RADIUS.lg}
                        >
                        <Sheet.Handle backgroundColor="$gray8" />
                        <ScrollView>
                            <YStack 
                                space={SPACING.lg} 
                                padding={SPACING.lg}
                            >
                            <YStack 
                                space={SPACING.md}
                                padding={SPACING.md}
                                borderWidth={1}
                                borderColor="$borderColor"
                                borderRadius={BORDER_RADIUS.md}
                                backgroundColor="$gray1"
                            >
                                <Text 
                                    fontSize={TYPOGRAPHY.sizes.md}
                                    fontWeight={TYPOGRAPHY.weights.medium}
                                    color="$gray11"
                                    marginBottom={SPACING.xs}
                                >
                                    Sort by
                                </Text>
                                <RadioGroup 
                                    defaultValue={selectedSortOption}
                                    onValueChange={(value) => setSelectedSortOption(value)}
                                    space={SPACING.xs}
                                >
                                {sortOptions.map((sortOption, index) => (
                                    <XStack 
                                        alignItems="center" 
                                        space={SPACING.sm} 
                                        key={`sortoptions-${index}`}
                                        padding={SPACING.xs}
                                        borderRadius={BORDER_RADIUS.sm}
                                        backgroundColor="$background"
                                        borderWidth={selectedSortOption === sortOption ? 1 : 0}
                                        borderColor={selectedSortOption === sortOption ? "$blue6" : "transparent"}
                                    >
                                    <RadioGroup.Item value={`${sortOption}`} id={`radiogroup-${index}`} size="$2">
                                      <RadioGroup.Indicator />
                                    </RadioGroup.Item>
                              
                                    <Label 
                                        htmlFor={`radiogroup-${index}`}
                                        fontSize={TYPOGRAPHY.sizes.sm}
                                        color="$color"
                                        flex={1}
                                    >
                                      {sortOption}
                                    </Label>
                                  </XStack>
                                ))}
                                </RadioGroup>
                            </YStack>
                            </YStack>
                        </ScrollView>
                        <XStack 
                            padding={SPACING.md} 
                            justifyContent="flex-end" 
                            space={SPACING.sm}
                            borderTopWidth={1}
                            borderTopColor="$borderColor"
                            backgroundColor="$background"
                        >
                            <Button
                            size="$3"
                            variant="outlined"
                            onPress={() => setSortDropdownOpen(false)}
                            borderRadius={BORDER_RADIUS.md}
                            >
                            Cancel
                            </Button>
                            <Button
                            size="$3"
                            onPress={() => {
                                setSortDropdownOpen(false);
                            }}
                            backgroundColor="$blue9"
                            color="white"
                            borderRadius={BORDER_RADIUS.md}
                            >
                            Apply
                            </Button>
                        </XStack>
                        </Sheet.Frame>
                    </Sheet>
                    )}

                    <View style={CONTAINER_STYLES.section}>
                        <Loader loading={loading}>
                            <ContactsList contacts={contacts} prefix="searchlist"/>
                        </Loader>
                    </View>
                </YStack>
            </ScrollView>
        </View>
    );

}
