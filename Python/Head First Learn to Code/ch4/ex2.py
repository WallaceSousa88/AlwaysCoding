smoothies = ['coconut' , 'strawberry' , 'banana' , 'pineapple' , 'acai berry']
favorite = smoothies[2]

smoothies[3] = 'tropical'

length = len(smoothies)
last = smoothies[length - 1]
print(last)

print(smoothies[-1])

for smoothie in smoothies :
    output = 'We serve ' + smoothie
    print(output)

# range(5)
for i in range(5) :
    print('Iterating through' , i)

lenght = len(smoothies)
for i in range(lenght) :
    print('Smoothie #' , i , smoothies[i])

# range(5 , 10)
# range(3 , 10 , 2)
# range(10 , 0 , -1)
# range(-10 , 2)