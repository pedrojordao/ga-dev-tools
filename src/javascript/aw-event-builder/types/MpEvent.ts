import {
  MPEventType,
  MPEventCategory,
  MPEventData,
  emptyEvent,
  Parameter,
  Parameters,
  ParameterType,
  eventTypesFor
} from "./events";

export class MPEvent {
  private eventType: MPEventType;
  private eventData: MPEventData;
  private name?: string;

  static eventTypes = (category: MPEventCategory): MPEventType[] => {
    return eventTypesFor(category);
  };

  static categories = (): MPEventCategory[] => {
    return Object.values(MPEventCategory);
  };

  static parameterTypeOptions = (): ParameterType[] => {
    return Object.values(ParameterType);
  };

  static eventTypeFromString = (eventType: string): MPEventType | undefined => {
    const assumed: MPEventType = eventType as MPEventType;
    switch (assumed) {
      case MPEventType.CustomEvent:
      case MPEventType.JoinGroup:
      case MPEventType.Login:
      case MPEventType.PresentOffer:
      case MPEventType.Purchase:
      case MPEventType.Refund:
      case MPEventType.Search:
      case MPEventType.SelectContent:
      case MPEventType.Share:
      case MPEventType.SignUp:
      case MPEventType.SpendVirtualCurrency:
      case MPEventType.EarnVirtualCurrency:
      case MPEventType.TutorialBegin:
      case MPEventType.TutorialComplete:
      case MPEventType.AddPaymentInfo:
      case MPEventType.AddToCart:
      case MPEventType.AddToWishlist:
      case MPEventType.BeginCheckout:
      case MPEventType.EcommercePurchase:
      case MPEventType.GenerateLead:
      case MPEventType.PurchaseRefund:
      case MPEventType.ViewItem:
      case MPEventType.ViewItemList:
      case MPEventType.ViewSearchResults:
      case MPEventType.LevelUp:
      case MPEventType.PostScore:
      case MPEventType.UnlockAchievement:
      case MPEventType.AdExposure:
      case MPEventType.AdReward:
      case MPEventType.AppException:
      case MPEventType.AppStoreRefund:
      case MPEventType.AppStoreSubscriptionCancel:
      case MPEventType.AppStoreSubscriptionConvert:
      case MPEventType.AppStoreSubscriptionRenew:
      case MPEventType.DynamicLinkAppOpen:
      case MPEventType.DynamicLinkAppUpdate:
      case MPEventType.DynamicLinkFirstOpen:
        return assumed;
    }
    return undefined;
  };

  static empty = (eventType: MPEventType) => {
    return new MPEvent(eventType, emptyEvent(eventType));
  };

  static default = () => {
    return MPEvent.empty(MPEventType.Purchase);
  };

  constructor(eventType: MPEventType, eventData: MPEventData) {
    this.eventType = eventType;
    this.eventData = eventData;
  }

  clone(): MPEvent {
    const clonedData = { ...this.eventData };
    const nuEvent = new MPEvent(this.eventType, clonedData);
    nuEvent.name = this.name;
    return nuEvent;
  }

  getCategories(): MPEventCategory[] {
    return MPEvent.categories().filter(category =>
      MPEvent.eventTypes(category).find(a => a === this.getEventType())
    );
  }

  getEventData(): MPEventData {
    return this.eventData;
  }

  getEventType(): MPEventType {
    return this.eventType;
  }
  getEventName(): string {
    if (this.eventType === MPEventType.CustomEvent) {
      return this.name || "";
    } else {
      return this.eventData.type;
    }
  }

  static parameterToPayload = (parameter: Parameter): {} | "unset" => {
    switch (parameter.type) {
      case ParameterType.OptionalNumber:
        if (parameter.value === undefined) {
          return "unset";
        }
        return { [parameter.name]: parameter.value };
      case ParameterType.OptionalString:
        if (parameter.value === "" || parameter.value === undefined) {
          return "unset";
        }
        return { [parameter.name]: parameter.value };
      case ParameterType.RequiredArray:
        return {
          [parameter.name]: parameter.value.map(item =>
            Object.values(item.parameters)
              .concat(Object.values(item.customParameters))
              .map(MPEvent.parameterToPayload)
              .reduce((itemsPayload: {}, itemParam) => {
                if (itemParam === "unset") {
                  return itemsPayload;
                } else {
                  return {
                    ...itemsPayload,
                    ...itemParam
                  };
                }
              }, {})
          )
        };
    }
  };

  asPayload(): {} {
    const params = this.getParameters()
      .concat(this.getCustomParameters())
      .map(MPEvent.parameterToPayload)
      .reduce((payload: {}, parameter) => {
        if (parameter === "unset") {
          return payload;
        } else {
          return {
            ...payload,
            ...parameter
          };
        }
      }, {});
    return {
      name: this.getEventName(),
      params
    };
  }

  updateName(nuName: string): MPEvent {
    if (this.eventType !== MPEventType.CustomEvent) {
      throw new Error("Only custom events can update their name");
    }
    const nuEvent = this.clone();
    nuEvent.name = nuName;
    return nuEvent;
  }

  updateParameters(update: (old: Parameters) => Parameters): MPEvent {
    const nuEvent = this.clone();
    const nuParameters = update(nuEvent.eventData.parameters);
    nuEvent.eventData.parameters = nuParameters;
    return nuEvent;
  }

  updateCustomParameters(update: (old: Parameters) => Parameters): MPEvent {
    const nuEvent = this.clone();
    const nuCustomParameters = update(nuEvent.eventData.customParameters);
    nuEvent.eventData.customParameters = nuCustomParameters;
    return nuEvent;
  }

  getParameters(): Parameter[] {
    return Object.values<Parameter>(this.eventData.parameters);
  }
  getCustomParameters(): Parameter[] {
    return Object.values<Parameter>(this.eventData.customParameters);
  }

  addCustomParameter(parameterName: string, parameter: Parameter): MPEvent {
    const nuEvent = this.clone();
    nuEvent.eventData.customParameters[parameterName] = parameter;
    return nuEvent;
  }

  removeCustomParameter(parameterName: string): MPEvent {
    const nuEvent = this.clone();
    delete nuEvent.eventData.customParameters[parameterName];
    return nuEvent;
  }

  updateCustomParameterName(parameterName: string, newName: string): MPEvent {
    const nuEvent = this.clone();
    // Copy the old parameter value into the new name.
    nuEvent.eventData.customParameters[newName] =
      nuEvent.eventData.customParameters[parameterName];
    return nuEvent.removeCustomParameter(parameterName);
  }
}
