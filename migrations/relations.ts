import { relations } from "drizzle-orm/relations";
import { users, coachNotes, meets, results, coaches, athleteGroups, groupMembers, practicePrograms, reminders, clubs, practiceSessions, practiceExercises, practiceCompletions, practiceMedia, practiceQuestions, clubMembers, groups, chatGroupMembers, chatGroupMessages, chatGroups, groupMessages, athleteGroupMembers, clubMessages, userAchievements, achievements, loginStreaks, spikeTransactions, referrals, trainingPrograms, programPurchases, programProgress, programSessions, workoutSessionPreview, programAssignments, athleteProfiles, workoutLibrary, journalEntries, notifications, follows, coachAthletes, coachingRequests, sprinthiaConversations, sprinthiaMessages, workoutReactions, exerciseLibrary, exerciseShares, videoAnalysis, conversations, directMessages, competitions, competitionEvents, athleteCompetitionResults, userFavoriteCompetitions, aiVideoAnalyses, aiPromptUsage, messageReactions, telegramDirectMessages, blockedUsers } from "./schema";

export const coachNotesRelations = relations(coachNotes, ({one}) => ({
	user_coachId: one(users, {
		fields: [coachNotes.coachId],
		references: [users.id],
		relationName: "coachNotes_coachId_users_id"
	}),
	user_athleteId: one(users, {
		fields: [coachNotes.athleteId],
		references: [users.id],
		relationName: "coachNotes_athleteId_users_id"
	}),
	meet: one(meets, {
		fields: [coachNotes.meetId],
		references: [meets.id]
	}),
	result: one(results, {
		fields: [coachNotes.resultId],
		references: [results.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	coachNotes_coachId: many(coachNotes, {
		relationName: "coachNotes_coachId_users_id"
	}),
	coachNotes_athleteId: many(coachNotes, {
		relationName: "coachNotes_athleteId_users_id"
	}),
	coaches_userId: many(coaches, {
		relationName: "coaches_userId_users_id"
	}),
	coaches_athleteId: many(coaches, {
		relationName: "coaches_athleteId_users_id"
	}),
	groupMembers: many(groupMembers),
	meets_userId: many(meets, {
		relationName: "meets_userId_users_id"
	}),
	meets_coachId: many(meets, {
		relationName: "meets_coachId_users_id"
	}),
	practicePrograms: many(practicePrograms),
	athleteGroups: many(athleteGroups),
	results_userId: many(results, {
		relationName: "results_userId_users_id"
	}),
	results_coachId: many(results, {
		relationName: "results_coachId_users_id"
	}),
	reminders_userId: many(reminders, {
		relationName: "reminders_userId_users_id"
	}),
	reminders_coachId: many(reminders, {
		relationName: "reminders_coachId_users_id"
	}),
	club: one(clubs, {
		fields: [users.defaultClubId],
		references: [clubs.id],
		relationName: "users_defaultClubId_clubs_id"
	}),
	practiceSessions: many(practiceSessions),
	practiceCompletions: many(practiceCompletions),
	practiceMedias: many(practiceMedia),
	practiceQuestions_athleteId: many(practiceQuestions, {
		relationName: "practiceQuestions_athleteId_users_id"
	}),
	practiceQuestions_coachId: many(practiceQuestions, {
		relationName: "practiceQuestions_coachId_users_id"
	}),
	clubs: many(clubs, {
		relationName: "clubs_ownerId_users_id"
	}),
	clubMembers: many(clubMembers),
	groups: many(groups),
	chatGroupMembers: many(chatGroupMembers),
	groupMessages: many(groupMessages),
	athleteGroupMembers: many(athleteGroupMembers),
	clubMessages: many(clubMessages),
	userAchievements: many(userAchievements),
	loginStreaks: many(loginStreaks),
	spikeTransactions: many(spikeTransactions),
	referrals_referrerId: many(referrals, {
		relationName: "referrals_referrerId_users_id"
	}),
	referrals_referredId: many(referrals, {
		relationName: "referrals_referredId_users_id"
	}),
	programPurchases: many(programPurchases),
	programProgresses: many(programProgress),
	workoutSessionPreviews: many(workoutSessionPreview),
	programAssignments_assignerId: many(programAssignments, {
		relationName: "programAssignments_assignerId_users_id"
	}),
	programAssignments_assigneeId: many(programAssignments, {
		relationName: "programAssignments_assigneeId_users_id"
	}),
	athleteProfiles: many(athleteProfiles),
	workoutLibraries_userId: many(workoutLibrary, {
		relationName: "workoutLibrary_userId_users_id"
	}),
	workoutLibraries_originalUserId: many(workoutLibrary, {
		relationName: "workoutLibrary_originalUserId_users_id"
	}),
	journalEntries: many(journalEntries),
	notifications: many(notifications),
	follows_followerId: many(follows, {
		relationName: "follows_followerId_users_id"
	}),
	follows_followingId: many(follows, {
		relationName: "follows_followingId_users_id"
	}),
	coachAthletes_coachId: many(coachAthletes, {
		relationName: "coachAthletes_coachId_users_id"
	}),
	coachAthletes_athleteId: many(coachAthletes, {
		relationName: "coachAthletes_athleteId_users_id"
	}),
	coachingRequests_fromUserId: many(coachingRequests, {
		relationName: "coachingRequests_fromUserId_users_id"
	}),
	coachingRequests_toUserId: many(coachingRequests, {
		relationName: "coachingRequests_toUserId_users_id"
	}),
	sprinthiaConversations: many(sprinthiaConversations),
	workoutReactions: many(workoutReactions),
	exerciseShares_fromUserId: many(exerciseShares, {
		relationName: "exerciseShares_fromUserId_users_id"
	}),
	exerciseShares_toUserId: many(exerciseShares, {
		relationName: "exerciseShares_toUserId_users_id"
	}),
	exerciseLibraries: many(exerciseLibrary),
	conversations_user1Id: many(conversations, {
		relationName: "conversations_user1Id_users_id"
	}),
	conversations_user2Id: many(conversations, {
		relationName: "conversations_user2Id_users_id"
	}),
	directMessages_senderId: many(directMessages, {
		relationName: "directMessages_senderId_users_id"
	}),
	directMessages_receiverId: many(directMessages, {
		relationName: "directMessages_receiverId_users_id"
	}),
	videoAnalyses: many(videoAnalysis),
	userFavoriteCompetitions: many(userFavoriteCompetitions),
	trainingPrograms: many(trainingPrograms),
	aiVideoAnalyses: many(aiVideoAnalyses),
	aiPromptUsages: many(aiPromptUsage),
	chatGroupMessages: many(chatGroupMessages),
	chatGroups_creatorId: many(chatGroups, {
		relationName: "chatGroups_creatorId_users_id"
	}),
	chatGroups_lastMessageSenderId: many(chatGroups, {
		relationName: "chatGroups_lastMessageSenderId_users_id"
	}),
	messageReactions: many(messageReactions),
	telegramDirectMessages_senderId: many(telegramDirectMessages, {
		relationName: "telegramDirectMessages_senderId_users_id"
	}),
	telegramDirectMessages_receiverId: many(telegramDirectMessages, {
		relationName: "telegramDirectMessages_receiverId_users_id"
	}),
	blockedUsers_blockerId: many(blockedUsers, {
		relationName: "blockedUsers_blockerId_users_id"
	}),
	blockedUsers_blockedId: many(blockedUsers, {
		relationName: "blockedUsers_blockedId_users_id"
	}),
}));

export const meetsRelations = relations(meets, ({one, many}) => ({
	coachNotes: many(coachNotes),
	user_userId: one(users, {
		fields: [meets.userId],
		references: [users.id],
		relationName: "meets_userId_users_id"
	}),
	user_coachId: one(users, {
		fields: [meets.coachId],
		references: [users.id],
		relationName: "meets_coachId_users_id"
	}),
	athleteGroup: one(athleteGroups, {
		fields: [meets.groupId],
		references: [athleteGroups.id]
	}),
	results: many(results),
	reminders: many(reminders),
}));

export const resultsRelations = relations(results, ({one, many}) => ({
	coachNotes: many(coachNotes),
	meet: one(meets, {
		fields: [results.meetId],
		references: [meets.id]
	}),
	user_userId: one(users, {
		fields: [results.userId],
		references: [users.id],
		relationName: "results_userId_users_id"
	}),
	user_coachId: one(users, {
		fields: [results.coachId],
		references: [users.id],
		relationName: "results_coachId_users_id"
	}),
}));

export const coachesRelations = relations(coaches, ({one}) => ({
	user_userId: one(users, {
		fields: [coaches.userId],
		references: [users.id],
		relationName: "coaches_userId_users_id"
	}),
	user_athleteId: one(users, {
		fields: [coaches.athleteId],
		references: [users.id],
		relationName: "coaches_athleteId_users_id"
	}),
}));

export const groupMembersRelations = relations(groupMembers, ({one}) => ({
	athleteGroup: one(athleteGroups, {
		fields: [groupMembers.groupId],
		references: [athleteGroups.id]
	}),
	user: one(users, {
		fields: [groupMembers.athleteId],
		references: [users.id]
	}),
}));

export const athleteGroupsRelations = relations(athleteGroups, ({one, many}) => ({
	groupMembers: many(groupMembers),
	meets: many(meets),
	user: one(users, {
		fields: [athleteGroups.coachId],
		references: [users.id]
	}),
	athleteGroupMembers: many(athleteGroupMembers),
}));

export const practiceProgramsRelations = relations(practicePrograms, ({one, many}) => ({
	user: one(users, {
		fields: [practicePrograms.coachId],
		references: [users.id]
	}),
	practiceSessions: many(practiceSessions),
}));

export const remindersRelations = relations(reminders, ({one}) => ({
	meet: one(meets, {
		fields: [reminders.meetId],
		references: [meets.id]
	}),
	user_userId: one(users, {
		fields: [reminders.userId],
		references: [users.id],
		relationName: "reminders_userId_users_id"
	}),
	user_coachId: one(users, {
		fields: [reminders.coachId],
		references: [users.id],
		relationName: "reminders_coachId_users_id"
	}),
}));

export const clubsRelations = relations(clubs, ({one, many}) => ({
	users: many(users, {
		relationName: "users_defaultClubId_clubs_id"
	}),
	user: one(users, {
		fields: [clubs.ownerId],
		references: [users.id],
		relationName: "clubs_ownerId_users_id"
	}),
	clubMembers: many(clubMembers),
	groups: many(groups),
	clubMessages: many(clubMessages),
}));

export const practiceSessionsRelations = relations(practiceSessions, ({one, many}) => ({
	practiceProgram: one(practicePrograms, {
		fields: [practiceSessions.programId],
		references: [practicePrograms.id]
	}),
	user: one(users, {
		fields: [practiceSessions.coachId],
		references: [users.id]
	}),
	practiceExercises: many(practiceExercises),
	practiceCompletions: many(practiceCompletions),
	practiceQuestions: many(practiceQuestions),
}));

export const practiceExercisesRelations = relations(practiceExercises, ({one}) => ({
	practiceSession: one(practiceSessions, {
		fields: [practiceExercises.sessionId],
		references: [practiceSessions.id]
	}),
}));

export const practiceCompletionsRelations = relations(practiceCompletions, ({one, many}) => ({
	practiceSession: one(practiceSessions, {
		fields: [practiceCompletions.sessionId],
		references: [practiceSessions.id]
	}),
	user: one(users, {
		fields: [practiceCompletions.athleteId],
		references: [users.id]
	}),
	practiceMedias: many(practiceMedia),
}));

export const practiceMediaRelations = relations(practiceMedia, ({one}) => ({
	practiceCompletion: one(practiceCompletions, {
		fields: [practiceMedia.completionId],
		references: [practiceCompletions.id]
	}),
	user: one(users, {
		fields: [practiceMedia.athleteId],
		references: [users.id]
	}),
}));

export const practiceQuestionsRelations = relations(practiceQuestions, ({one}) => ({
	practiceSession: one(practiceSessions, {
		fields: [practiceQuestions.sessionId],
		references: [practiceSessions.id]
	}),
	user_athleteId: one(users, {
		fields: [practiceQuestions.athleteId],
		references: [users.id],
		relationName: "practiceQuestions_athleteId_users_id"
	}),
	user_coachId: one(users, {
		fields: [practiceQuestions.coachId],
		references: [users.id],
		relationName: "practiceQuestions_coachId_users_id"
	}),
}));

export const clubMembersRelations = relations(clubMembers, ({one}) => ({
	club: one(clubs, {
		fields: [clubMembers.clubId],
		references: [clubs.id]
	}),
	user: one(users, {
		fields: [clubMembers.userId],
		references: [users.id]
	}),
}));

export const groupsRelations = relations(groups, ({one, many}) => ({
	club: one(clubs, {
		fields: [groups.clubId],
		references: [clubs.id]
	}),
	user: one(users, {
		fields: [groups.createdBy],
		references: [users.id]
	}),
	groupMessages: many(groupMessages),
}));

export const chatGroupMembersRelations = relations(chatGroupMembers, ({one}) => ({
	user: one(users, {
		fields: [chatGroupMembers.userId],
		references: [users.id]
	}),
	chatGroupMessage: one(chatGroupMessages, {
		fields: [chatGroupMembers.lastReadMessageId],
		references: [chatGroupMessages.id]
	}),
	chatGroup: one(chatGroups, {
		fields: [chatGroupMembers.groupId],
		references: [chatGroups.id]
	}),
}));

export const chatGroupMessagesRelations = relations(chatGroupMessages, ({one, many}) => ({
	chatGroupMembers: many(chatGroupMembers),
	chatGroup: one(chatGroups, {
		fields: [chatGroupMessages.groupId],
		references: [chatGroups.id]
	}),
	user: one(users, {
		fields: [chatGroupMessages.senderId],
		references: [users.id]
	}),
}));

export const chatGroupsRelations = relations(chatGroups, ({one, many}) => ({
	chatGroupMembers: many(chatGroupMembers),
	chatGroupMessages: many(chatGroupMessages),
	user_creatorId: one(users, {
		fields: [chatGroups.creatorId],
		references: [users.id],
		relationName: "chatGroups_creatorId_users_id"
	}),
	user_lastMessageSenderId: one(users, {
		fields: [chatGroups.lastMessageSenderId],
		references: [users.id],
		relationName: "chatGroups_lastMessageSenderId_users_id"
	}),
}));

export const groupMessagesRelations = relations(groupMessages, ({one}) => ({
	group: one(groups, {
		fields: [groupMessages.groupId],
		references: [groups.id]
	}),
	user: one(users, {
		fields: [groupMessages.senderId],
		references: [users.id]
	}),
}));

export const athleteGroupMembersRelations = relations(athleteGroupMembers, ({one}) => ({
	athleteGroup: one(athleteGroups, {
		fields: [athleteGroupMembers.groupId],
		references: [athleteGroups.id]
	}),
	user: one(users, {
		fields: [athleteGroupMembers.athleteId],
		references: [users.id]
	}),
}));

export const clubMessagesRelations = relations(clubMessages, ({one}) => ({
	club: one(clubs, {
		fields: [clubMessages.clubId],
		references: [clubs.id]
	}),
	user: one(users, {
		fields: [clubMessages.userId],
		references: [users.id]
	}),
}));

export const userAchievementsRelations = relations(userAchievements, ({one}) => ({
	user: one(users, {
		fields: [userAchievements.userId],
		references: [users.id]
	}),
	achievement: one(achievements, {
		fields: [userAchievements.achievementId],
		references: [achievements.id]
	}),
}));

export const achievementsRelations = relations(achievements, ({many}) => ({
	userAchievements: many(userAchievements),
}));

export const loginStreaksRelations = relations(loginStreaks, ({one}) => ({
	user: one(users, {
		fields: [loginStreaks.userId],
		references: [users.id]
	}),
}));

export const spikeTransactionsRelations = relations(spikeTransactions, ({one}) => ({
	user: one(users, {
		fields: [spikeTransactions.userId],
		references: [users.id]
	}),
}));

export const referralsRelations = relations(referrals, ({one}) => ({
	user_referrerId: one(users, {
		fields: [referrals.referrerId],
		references: [users.id],
		relationName: "referrals_referrerId_users_id"
	}),
	user_referredId: one(users, {
		fields: [referrals.referredId],
		references: [users.id],
		relationName: "referrals_referredId_users_id"
	}),
}));

export const programPurchasesRelations = relations(programPurchases, ({one}) => ({
	trainingProgram: one(trainingPrograms, {
		fields: [programPurchases.programId],
		references: [trainingPrograms.id]
	}),
	user: one(users, {
		fields: [programPurchases.userId],
		references: [users.id]
	}),
}));

export const trainingProgramsRelations = relations(trainingPrograms, ({one, many}) => ({
	programPurchases: many(programPurchases),
	programProgresses: many(programProgress),
	programAssignments: many(programAssignments),
	programSessions: many(programSessions),
	user: one(users, {
		fields: [trainingPrograms.userId],
		references: [users.id]
	}),
}));

export const programProgressRelations = relations(programProgress, ({one}) => ({
	user: one(users, {
		fields: [programProgress.userId],
		references: [users.id]
	}),
	trainingProgram: one(trainingPrograms, {
		fields: [programProgress.programId],
		references: [trainingPrograms.id]
	}),
	programSession: one(programSessions, {
		fields: [programProgress.sessionId],
		references: [programSessions.id]
	}),
}));

export const programSessionsRelations = relations(programSessions, ({one, many}) => ({
	programProgresses: many(programProgress),
	trainingProgram: one(trainingPrograms, {
		fields: [programSessions.programId],
		references: [trainingPrograms.id]
	}),
	workoutReactions: many(workoutReactions),
}));

export const workoutSessionPreviewRelations = relations(workoutSessionPreview, ({one}) => ({
	user: one(users, {
		fields: [workoutSessionPreview.userId],
		references: [users.id]
	}),
}));

export const programAssignmentsRelations = relations(programAssignments, ({one}) => ({
	trainingProgram: one(trainingPrograms, {
		fields: [programAssignments.programId],
		references: [trainingPrograms.id]
	}),
	user_assignerId: one(users, {
		fields: [programAssignments.assignerId],
		references: [users.id],
		relationName: "programAssignments_assignerId_users_id"
	}),
	user_assigneeId: one(users, {
		fields: [programAssignments.assigneeId],
		references: [users.id],
		relationName: "programAssignments_assigneeId_users_id"
	}),
}));

export const athleteProfilesRelations = relations(athleteProfiles, ({one}) => ({
	user: one(users, {
		fields: [athleteProfiles.userId],
		references: [users.id]
	}),
}));

export const workoutLibraryRelations = relations(workoutLibrary, ({one}) => ({
	user_userId: one(users, {
		fields: [workoutLibrary.userId],
		references: [users.id],
		relationName: "workoutLibrary_userId_users_id"
	}),
	user_originalUserId: one(users, {
		fields: [workoutLibrary.originalUserId],
		references: [users.id],
		relationName: "workoutLibrary_originalUserId_users_id"
	}),
}));

export const journalEntriesRelations = relations(journalEntries, ({one}) => ({
	user: one(users, {
		fields: [journalEntries.userId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const followsRelations = relations(follows, ({one}) => ({
	user_followerId: one(users, {
		fields: [follows.followerId],
		references: [users.id],
		relationName: "follows_followerId_users_id"
	}),
	user_followingId: one(users, {
		fields: [follows.followingId],
		references: [users.id],
		relationName: "follows_followingId_users_id"
	}),
}));

export const coachAthletesRelations = relations(coachAthletes, ({one}) => ({
	user_coachId: one(users, {
		fields: [coachAthletes.coachId],
		references: [users.id],
		relationName: "coachAthletes_coachId_users_id"
	}),
	user_athleteId: one(users, {
		fields: [coachAthletes.athleteId],
		references: [users.id],
		relationName: "coachAthletes_athleteId_users_id"
	}),
}));

export const coachingRequestsRelations = relations(coachingRequests, ({one}) => ({
	user_fromUserId: one(users, {
		fields: [coachingRequests.fromUserId],
		references: [users.id],
		relationName: "coachingRequests_fromUserId_users_id"
	}),
	user_toUserId: one(users, {
		fields: [coachingRequests.toUserId],
		references: [users.id],
		relationName: "coachingRequests_toUserId_users_id"
	}),
}));

export const sprinthiaConversationsRelations = relations(sprinthiaConversations, ({one, many}) => ({
	user: one(users, {
		fields: [sprinthiaConversations.userId],
		references: [users.id]
	}),
	sprinthiaMessages: many(sprinthiaMessages),
}));

export const sprinthiaMessagesRelations = relations(sprinthiaMessages, ({one}) => ({
	sprinthiaConversation: one(sprinthiaConversations, {
		fields: [sprinthiaMessages.conversationId],
		references: [sprinthiaConversations.id]
	}),
}));

export const workoutReactionsRelations = relations(workoutReactions, ({one}) => ({
	user: one(users, {
		fields: [workoutReactions.userId],
		references: [users.id]
	}),
	programSession: one(programSessions, {
		fields: [workoutReactions.sessionId],
		references: [programSessions.id]
	}),
}));

export const exerciseSharesRelations = relations(exerciseShares, ({one}) => ({
	exerciseLibrary: one(exerciseLibrary, {
		fields: [exerciseShares.exerciseId],
		references: [exerciseLibrary.id]
	}),
	user_fromUserId: one(users, {
		fields: [exerciseShares.fromUserId],
		references: [users.id],
		relationName: "exerciseShares_fromUserId_users_id"
	}),
	user_toUserId: one(users, {
		fields: [exerciseShares.toUserId],
		references: [users.id],
		relationName: "exerciseShares_toUserId_users_id"
	}),
}));

export const exerciseLibraryRelations = relations(exerciseLibrary, ({one, many}) => ({
	exerciseShares: many(exerciseShares),
	user: one(users, {
		fields: [exerciseLibrary.userId],
		references: [users.id]
	}),
	videoAnalysis: one(videoAnalysis, {
		fields: [exerciseLibrary.videoAnalysisId],
		references: [videoAnalysis.id]
	}),
}));

export const videoAnalysisRelations = relations(videoAnalysis, ({one, many}) => ({
	exerciseLibraries: many(exerciseLibrary),
	user: one(users, {
		fields: [videoAnalysis.userId],
		references: [users.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	user_user1Id: one(users, {
		fields: [conversations.user1Id],
		references: [users.id],
		relationName: "conversations_user1Id_users_id"
	}),
	user_user2Id: one(users, {
		fields: [conversations.user2Id],
		references: [users.id],
		relationName: "conversations_user2Id_users_id"
	}),
	telegramDirectMessages: many(telegramDirectMessages),
}));

export const directMessagesRelations = relations(directMessages, ({one}) => ({
	user_senderId: one(users, {
		fields: [directMessages.senderId],
		references: [users.id],
		relationName: "directMessages_senderId_users_id"
	}),
	user_receiverId: one(users, {
		fields: [directMessages.receiverId],
		references: [users.id],
		relationName: "directMessages_receiverId_users_id"
	}),
}));

export const competitionEventsRelations = relations(competitionEvents, ({one, many}) => ({
	competition: one(competitions, {
		fields: [competitionEvents.competitionId],
		references: [competitions.id]
	}),
	athleteCompetitionResults: many(athleteCompetitionResults),
}));

export const competitionsRelations = relations(competitions, ({many}) => ({
	competitionEvents: many(competitionEvents),
	athleteCompetitionResults: many(athleteCompetitionResults),
	userFavoriteCompetitions: many(userFavoriteCompetitions),
}));

export const athleteCompetitionResultsRelations = relations(athleteCompetitionResults, ({one}) => ({
	competition: one(competitions, {
		fields: [athleteCompetitionResults.competitionId],
		references: [competitions.id]
	}),
	competitionEvent: one(competitionEvents, {
		fields: [athleteCompetitionResults.eventId],
		references: [competitionEvents.id]
	}),
}));

export const userFavoriteCompetitionsRelations = relations(userFavoriteCompetitions, ({one}) => ({
	user: one(users, {
		fields: [userFavoriteCompetitions.userId],
		references: [users.id]
	}),
	competition: one(competitions, {
		fields: [userFavoriteCompetitions.competitionId],
		references: [competitions.id]
	}),
}));

export const aiVideoAnalysesRelations = relations(aiVideoAnalyses, ({one}) => ({
	user: one(users, {
		fields: [aiVideoAnalyses.userId],
		references: [users.id]
	}),
}));

export const aiPromptUsageRelations = relations(aiPromptUsage, ({one}) => ({
	user: one(users, {
		fields: [aiPromptUsage.userId],
		references: [users.id]
	}),
}));

export const messageReactionsRelations = relations(messageReactions, ({one}) => ({
	user: one(users, {
		fields: [messageReactions.userId],
		references: [users.id]
	}),
}));

export const telegramDirectMessagesRelations = relations(telegramDirectMessages, ({one, many}) => ({
	conversation: one(conversations, {
		fields: [telegramDirectMessages.conversationId],
		references: [conversations.id]
	}),
	user_senderId: one(users, {
		fields: [telegramDirectMessages.senderId],
		references: [users.id],
		relationName: "telegramDirectMessages_senderId_users_id"
	}),
	user_receiverId: one(users, {
		fields: [telegramDirectMessages.receiverId],
		references: [users.id],
		relationName: "telegramDirectMessages_receiverId_users_id"
	}),
	telegramDirectMessage: one(telegramDirectMessages, {
		fields: [telegramDirectMessages.replyToId],
		references: [telegramDirectMessages.id],
		relationName: "telegramDirectMessages_replyToId_telegramDirectMessages_id"
	}),
	telegramDirectMessages: many(telegramDirectMessages, {
		relationName: "telegramDirectMessages_replyToId_telegramDirectMessages_id"
	}),
}));

export const blockedUsersRelations = relations(blockedUsers, ({one}) => ({
	user_blockerId: one(users, {
		fields: [blockedUsers.blockerId],
		references: [users.id],
		relationName: "blockedUsers_blockerId_users_id"
	}),
	user_blockedId: one(users, {
		fields: [blockedUsers.blockedId],
		references: [users.id],
		relationName: "blockedUsers_blockedId_users_id"
	}),
}));