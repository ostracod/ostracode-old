
export class ContainerContent {
    
}

export class VarContent extends ContainerContent {
    
    constructor(variable, item = undefined) {
        super();
        this.variable = variable;
        this.item = item;
    }
}

export class CompartmentContent extends ContainerContent {
    
    constructor(compartment, typeId = undefined) {
        super();
        this.compartment = compartment;
        this.typeId = typeId;
    }
}


