menu = ['Pizza' , 'Pasta' , 'Soup' , 'Salad']

menu = []
menu.append('Burger')
menu.append('Sushi')
print(menu)

del menu[0]
print(menu)

menu.extend(['BBQ' , 'Tacos'])
print(menu)

menu = menu + ['BBQ' , 'Tacos']
print(menu)

menu.insert(1 , 'Stir Fry')
print(menu)