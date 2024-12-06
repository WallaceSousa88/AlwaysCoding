import random

winner = ''

random_choice = random.randint(0,2)
# print('The computer chooses' , random_choice)

if random_choice == 0 :
    computer_choice = 'rock'
elif random_choice == 1 :
    computer_choice = 'paper'
else :
    computer_choice = 'scissors'
# print("The computer chooses" , computer_choice)

# choices = [ 'rock' , 'paper' , 'scissors' ]
# computer_choice = random.choice(choices)

user_choice = ''
while (user_choice != 'rock' and
       user_choice != 'paper' and
       user_choice != 'scissors') :
    user_choice = input('rock, paper or scissors?')

# user_choice = input('rock, paper or scissors? ')
# print('You choose' , user_choice , 'and the computer choose' , computer_choice)

if computer_choice == user_choice :
    winner = 'Tie'
elif computer_choice == 'paper' and user_choice == 'rock' :
    winner = 'Computer'
elif computer_choice == 'rock' and user_choice == 'scissors' :
    winner = 'Computer'
elif computer_choice == 'scissors' and user_choice == 'paper' :
    winner = 'Computer'
else :
    winner = "User"

# print('The' , winner , 'wins!')

if winner == 'Tie' :
    print('We both choose' , computer_choice + ', play again.')
else :
    print(winner , 'won. The computer chose' , computer_choice + '.')

# -----

# if bank_balance >= ferrari_cost :
#     print('Why not?')
#     print('Go ahead, buy it')
# else :
#     print('Sorry')s
#     print('Try again next week')

# if bank_balance > ferrari_cost or loan == ferrari_cost :
#     print('Buy it!')

# if not bank_balance < ferrari_cost :
#     print('Buy it!')

# -----

# if number_of_scoops == 0 :
#     print("You didn't want ice cream?")
#     print("We have lots of flavors.")
# elif number_of_scoops == 1 :
#     print("A single scoop for you, coming up.")
# elif number_of_scoops == 2 :
#     print("Oh, two scoops for you!")
# elif number_of_scoops >= 3 :
#     print("Wow, that's a lot of scoops!")
# else :
#     print("I'm sorry I can't give you negative scoops!")

# scoops = 5
# while scoops > 0 :
#     print("Another scoop!")
#     scoops = scoops - 1
# print("Life without ice cream isn't the same.")